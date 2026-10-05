import type { JSX } from "solid-js";
import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { type CraftyDriver, connectCrafty } from "../devices/crafty/driver";
import {
  connectVentyVeazy,
  type VentyVeazyDriver,
} from "../devices/ventyVeazy/driver";
import { connectVolcano, type VolcanoDriver } from "../devices/volcano/driver";
import {
  connectGatt,
  hasUserActivation,
  sleep,
  supportsAdvertisementWatching,
  waitForAdvertisement,
  watchPresence,
} from "../utils/bluetoothConnect";
import { bluetoothQueue } from "../utils/bluetoothQueue";
import { ConnectionState, DeviceType, ServiceUUIDs } from "../utils/uuids";

export type DeviceInfo = {
  type: DeviceType;
  name: string;
  serialNumber?: string;
  firmwareVersion?: string;
};

const BluetoothContext =
  createContext<ReturnType<typeof createBluetoothMethods>>();

type BluetoothProviderProps = {
  children: JSX.Element;
};

export type ConnectionError =
  | { kind: "failed"; message: string }
  | { kind: "lost" }
  /** The last used device did not answer the direct connect */
  | { kind: "unreachable"; message: string };

/** What a connect attempt is waiting for, to tell the user */
export type ConnectPhase = "searching" | "connecting";

/** Thrown by a connect attempt that was cancelled or replaced meanwhile */
class AttemptCancelled extends Error {
  constructor() {
    super("Connect attempt cancelled");
  }
}

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const NO_DEVICE: DeviceInfo = { type: DeviceType.UNKNOWN, name: "" };

/**
 * Waits between reconnect attempts. Where advertisements can be watched, an
 * attempt starts as soon as the device shows up again.
 */
export const RECONNECT_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 8_000];
/** Without watching (Linux, ChromeOS): blind attempts, like Chrome's sample */
export const RECONNECT_DELAYS_BLIND_MS = [2_000, 4_000, 8_000];

/** How long to listen for the last used device if it was not seen yet */
const SEARCH_TIMEOUT_MS = 8_000;
/**
 * Time for connecting the last used device without seeing it first. Short,
 * so the device chooser can still open on the same click (the browser allows
 * that for about five seconds); the chooser's scan finds the device reliably.
 */
const DIRECT_CONNECT_BUDGET_MS = 3_500;
/** A GATT connect that takes longer has failed */
const CONNECT_TIMEOUT_MS = 8_000;
/** Pause before retrying a refused connect */
const RETRY_PAUSE_MS = 300;

/** The last connected device, to offer it again without the chooser */
export interface RememberedDevice {
  id: string;
  name: string;
  type: DeviceType;
}

const LAST_DEVICE_KEY = "lastBluetoothDevice";

const readRememberedDevice = (): RememberedDevice | undefined => {
  try {
    const stored = localStorage.getItem(LAST_DEVICE_KEY);
    return stored ? JSON.parse(stored) : undefined;
  } catch {
    return undefined;
  }
};

const storeRememberedDevice = (device: RememberedDevice) => {
  try {
    localStorage.setItem(LAST_DEVICE_KEY, JSON.stringify(device));
  } catch {
    // Without storage the chooser is simply shown every time
  }
};

const isIOS = () =>
  navigator.userAgent.includes("iPhone") ||
  navigator.userAgent.includes("iPad") ||
  navigator.userAgent.includes("WebBLE/1");

const detectDeviceType = (deviceName: string): DeviceType => {
  if (deviceName.includes("S&B VOLCANO")) return DeviceType.VOLCANO;
  if (deviceName.includes("S&B VY")) return DeviceType.VENTY;
  if (deviceName.includes("S&B VZ")) return DeviceType.VEAZY;
  return DeviceType.CRAFTY;
};

const getDeviceFilters = (): BluetoothLEScanFilter[] => {
  const nameFilters = [
    { namePrefix: "STORZ&BICKEL" },
    { namePrefix: "Storz&Bickel" },
    { namePrefix: "S&B" },
  ];
  // On iOS, only namePrefix filters are supported
  if (isIOS()) return nameFilters;
  return [
    ...nameFilters,
    {
      services: [
        ServiceUUIDs.Crafty1,
        ServiceUUIDs.Crafty2,
        ServiceUUIDs.Crafty3,
      ],
    },
    { services: [ServiceUUIDs.DeviceState, ServiceUUIDs.DeviceControl] },
    { services: [ServiceUUIDs.Primary] },
  ];
};

const createBluetoothMethods = () => {
  const [device, setDevice] = createSignal<BluetoothDevice>();
  const [connectionState, setConnectionState] = createSignal<ConnectionState>(
    ConnectionState.NOT_CONNECTED
  );
  const [deviceInfo, setDeviceInfo] = createSignal<DeviceInfo>(NO_DEVICE);
  const [connectionError, setConnectionError] = createSignal<ConnectionError>();
  const [reconnectAttempt, setReconnectAttempt] = createSignal(0);
  const [reconnectTotal, setReconnectTotal] = createSignal(
    RECONNECT_DELAYS_MS.length
  );
  const [connectPhase, setConnectPhase] =
    createSignal<ConnectPhase>("connecting");
  // Bumped to cancel a running connect or reconnect loop
  let reconnectToken = 0;
  // Ends waiting for advertisements or retry pauses when cancelled
  let cancelWaiting = new AbortController();

  const startAttempt = () => {
    cancelWaiting.abort();
    cancelWaiting = new AbortController();
    return { token: ++reconnectToken, signal: cancelWaiting.signal };
  };

  // A device the browser still has permission for (getDevices, Chrome only)
  const [knownDevice, setKnownDevice] = createSignal<BluetoothDevice>();
  const [rememberedDevice, setRememberedDevice] = createSignal(
    readRememberedDevice()
  );

  const findKnownDevice = async () => {
    const remembered = rememberedDevice();
    if (!remembered || typeof navigator.bluetooth?.getDevices !== "function") {
      return;
    }
    try {
      const devices = await navigator.bluetooth.getDevices();
      setKnownDevice(devices.find((d) => d.id === remembered.id));
    } catch (error) {
      console.warn("Looking up permitted devices failed:", error);
    }
  };
  findKnownDevice();

  // Whether the last used device advertises nearby. Only known where the
  // browser can watch advertisements, and only while nothing is connected.
  const [knownDeviceInRange, setKnownDeviceInRange] = createSignal(false);
  createEffect(() => {
    const known = knownDevice();
    const state = connectionState();
    const idle =
      state === ConnectionState.NOT_CONNECTED ||
      state === ConnectionState.CONNECTION_FAILED;
    if (!known || !idle || !supportsAdvertisementWatching(known)) return;
    // It may have left since it was last seen
    setKnownDeviceInRange(false);
    onCleanup(watchPresence(known, () => setKnownDeviceInRange(true)));
  });

  // One driver per device type; the device providers subscribe to them
  const [volcanoDriver, setVolcanoDriver] = createSignal<VolcanoDriver>();
  const [craftyDriver, setCraftyDriver] = createSignal<CraftyDriver>();
  const [ventyVeazyDriver, setVentyVeazyDriver] =
    createSignal<VentyVeazyDriver>();

  const disposeDrivers = async () => {
    const drivers = [volcanoDriver(), craftyDriver(), ventyVeazyDriver()];
    setVolcanoDriver(undefined);
    setCraftyDriver(undefined);
    setVentyVeazyDriver(undefined);
    await Promise.all(drivers.map((driver) => driver?.dispose()));
  };

  const releaseDevice = () => {
    const currentDevice = device();
    if (currentDevice) {
      currentDevice.removeEventListener(
        "gattserverdisconnected",
        handleDisconnect
      );
      // Also ends a gatt.connect() that is still pending
      currentDevice.gatt?.disconnect();
    }
    setDevice(undefined);
    setDeviceInfo(NO_DEVICE);
  };

  function handleDisconnect(event: Event) {
    console.log("🔌 Device disconnected unexpectedly:", event);
    // A drop while connecting is handled by the connect attempt itself
    if (connectionState() !== ConnectionState.CONNECTED) return;
    const lostDevice = device();
    disposeDrivers();
    if (lostDevice) {
      reconnect(lostDevice);
    } else {
      releaseDevice();
      setConnectionState(ConnectionState.NOT_CONNECTED);
      setConnectionError({ kind: "lost" });
    }
  }

  /** Tries to get the link back with the same device, no chooser needed */
  const reconnect = async (bluetoothDevice: BluetoothDevice) => {
    const { token, signal } = startAttempt();
    bluetoothDevice.removeEventListener(
      "gattserverdisconnected",
      handleDisconnect
    );
    setConnectionError(undefined);
    setConnectionState(ConnectionState.RECONNECTING);

    const watching = supportsAdvertisementWatching(bluetoothDevice);
    const delays = watching ? RECONNECT_DELAYS_MS : RECONNECT_DELAYS_BLIND_MS;
    setReconnectTotal(delays.length);

    for (const [index, delay] of delays.entries()) {
      setReconnectAttempt(index + 1);
      // Connect as soon as the device advertises again; without support for
      // watching, wait the planned time
      const seen = watching
        ? await waitForAdvertisement(bluetoothDevice, delay + 2_000, signal)
        : "unsupported";
      if (seen === "unsupported") await sleep(delay, signal);
      if (token !== reconnectToken) return;
      try {
        await connectToDevice(bluetoothDevice, token);
        setReconnectAttempt(0);
        setConnectionState(ConnectionState.CONNECTED);
        return;
      } catch (error) {
        await abandonAttempt(bluetoothDevice, token);
        if (token !== reconnectToken) return;
        console.warn(`Reconnect attempt ${index + 1} failed:`, error);
      }
    }

    if (token !== reconnectToken) return;
    setReconnectAttempt(0);
    releaseDevice();
    setConnectionState(ConnectionState.NOT_CONNECTED);
    setConnectionError({ kind: "lost" });
  };

  /**
   * Cleans up after a failed connect so the next attempt starts fresh. A
   * cancelled attempt leaves alone what a newer attempt may already use.
   */
  const abandonAttempt = async (
    bluetoothDevice: BluetoothDevice,
    token: number
  ) => {
    if (token !== reconnectToken) {
      if (device() !== bluetoothDevice) bluetoothDevice.gatt?.disconnect();
      return;
    }
    bluetoothDevice.removeEventListener(
      "gattserverdisconnected",
      handleDisconnect
    );
    await disposeDrivers();
    bluetoothDevice.gatt?.disconnect();
  };

  const disconnect = async () => {
    const { token } = startAttempt();
    const oldDevice = device();
    // Leave the connected state first, so a drop while the drivers shut down
    // does not start a reconnect
    oldDevice?.removeEventListener("gattserverdisconnected", handleDisconnect);
    setReconnectAttempt(0);
    setConnectionError(undefined);
    setConnectionState(ConnectionState.NOT_CONNECTED);
    await disposeDrivers();
    if (token === reconnectToken) releaseDevice();
    else if (oldDevice && oldDevice !== device()) oldDevice.gatt?.disconnect();
  };

  /**
   * Connects GATT and sets up the driver. Only an attempt that is still
   * current publishes its device and driver; a cancelled one throws.
   */
  const connectToDevice = async (
    bluetoothDevice: BluetoothDevice,
    token: number,
    timeoutMs = CONNECT_TIMEOUT_MS
  ) => {
    if (!bluetoothDevice.gatt) {
      throw new Error("Device does not support GATT");
    }
    const ensureCurrent = () => {
      if (token !== reconnectToken) throw new AttemptCancelled();
    };
    ensureCurrent();
    // Known early, so cancelling can end the pending connect
    setDevice(bluetoothDevice);
    const name = bluetoothDevice.name || "";
    const type = detectDeviceType(name);
    setDeviceInfo({ type, name });

    const server = await connectGatt(bluetoothDevice, timeoutMs);
    ensureCurrent();

    let publish: () => void;
    let driver: { dispose: () => Promise<void> };
    switch (type) {
      case DeviceType.VOLCANO: {
        const volcano = await connectVolcano(server, bluetoothQueue);
        driver = volcano;
        publish = () => {
          setDeviceInfo({
            type,
            name,
            serialNumber: volcano.info.serialNumber,
            firmwareVersion: volcano.info.firmwareVersion,
          });
          setVolcanoDriver(volcano);
        };
        break;
      }
      case DeviceType.VENTY:
      case DeviceType.VEAZY: {
        const model = type === DeviceType.VEAZY ? "VEAZY" : "VENTY";
        const ventyVeazy = await connectVentyVeazy(
          server,
          model,
          bluetoothQueue
        );
        driver = ventyVeazy;
        publish = () => {
          // Serial number is part of the name: "S&B VY123456"
          setDeviceInfo({ type, name, serialNumber: name.split(" ")[1] });
          setVentyVeazyDriver(ventyVeazy);
        };
        break;
      }
      default: {
        const crafty = await connectCrafty(server, bluetoothQueue);
        driver = crafty;
        publish = () => {
          setDeviceInfo({
            type,
            name,
            serialNumber: crafty.serialNumber || undefined,
            firmwareVersion: crafty.firmwareVersion,
          });
          setCraftyDriver(crafty);
        };
      }
    }

    if (token !== reconnectToken) {
      await driver.dispose();
      throw new AttemptCancelled();
    }
    publish();
    // Critical for handling unexpected disconnects
    bluetoothDevice.addEventListener(
      "gattserverdisconnected",
      handleDisconnect
    );
  };

  /**
   * Called by a device store whose first reads failed: without them the
   * device pages would show nothing but zeros.
   */
  const reportStartFailure = (driver: object, error: unknown) => {
    const current: unknown[] = [
      volcanoDriver(),
      craftyDriver(),
      ventyVeazyDriver(),
    ];
    // A lost connection is already being handled by the reconnect
    if (
      !current.includes(driver) ||
      connectionState() !== ConnectionState.CONNECTED ||
      !device()?.gatt?.connected
    ) {
      return;
    }
    startAttempt();
    setConnectionState(ConnectionState.CONNECTION_FAILED);
    setConnectionError({ kind: "failed", message: errorText(error) });
    disposeDrivers().finally(releaseDevice);
  };

  const rememberDevice = (bluetoothDevice: BluetoothDevice) => {
    const remembered = {
      id: bluetoothDevice.id,
      name: bluetoothDevice.name || "",
      type: deviceInfo().type,
    };
    storeRememberedDevice(remembered);
    setRememberedDevice(remembered);
    setKnownDevice(bluetoothDevice);
  };

  /**
   * Shows the browser's device chooser and connects the picked device.
   * `cancelError` is shown instead of nothing if the user closes the chooser.
   */
  const chooseDevice = async (cancelError?: ConnectionError) => {
    const { token } = startAttempt();
    setConnectPhase("connecting");
    setConnectionState(ConnectionState.CONNECTING);
    setConnectionError(undefined);

    let bluetoothDevice: BluetoothDevice;
    try {
      bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: getDeviceFilters(),
        acceptAllDevices: false,
        optionalServices: ["generic_access", ServiceUUIDs.GenericAccess],
      });
    } catch (error) {
      if (token !== reconnectToken) return;
      setConnectionState(ConnectionState.CONNECTION_FAILED);
      // Closing the chooser is not an error worth showing; other errors
      // (e.g. Bluetooth switched off) are
      const userCancelled =
        error instanceof DOMException &&
        error.name === "NotFoundError" &&
        /cancel/i.test(error.message);
      setConnectionError(
        userCancelled
          ? cancelError
          : { kind: "failed", message: errorText(error) }
      );
      return;
    }
    if (token !== reconnectToken) return;

    try {
      await connectToDevice(bluetoothDevice, token);
      rememberDevice(bluetoothDevice);
      setConnectionState(ConnectionState.CONNECTED);
    } catch (error) {
      await abandonAttempt(bluetoothDevice, token);
      if (token !== reconnectToken) return;
      console.error("Connection failed:", error);
      releaseDevice();
      setConnectionState(ConnectionState.CONNECTION_FAILED);
      setConnectionError({ kind: "failed", message: errorText(error) });
    }
  };

  const connect = () => chooseDevice();

  /**
   * Connects the last used device without the chooser. The system only
   * connects a device it has recently seen advertising. Where advertisements
   * can be watched, wait until it shows up, then connect. Elsewhere (Linux,
   * ChromeOS) try briefly and fall back to the chooser, whose scan finds the
   * device reliably, while the click still allows opening it.
   */
  const connectKnownDevice = async () => {
    const known = knownDevice();
    if (!known) return;
    const seenNearby = knownDeviceInRange();
    const { token, signal } = startAttempt();
    setConnectionError(undefined);
    setConnectionState(ConnectionState.CONNECTING);

    const watching = supportsAdvertisementWatching(known);
    if (watching && !seenNearby) {
      setConnectPhase("searching");
      const seen = await waitForAdvertisement(known, SEARCH_TIMEOUT_MS, signal);
      if (token !== reconnectToken) return;
      if (seen === "timeout") {
        setConnectionState(ConnectionState.CONNECTION_FAILED);
        setConnectionError({
          kind: "unreachable",
          message: "The device did not advertise",
        });
        return;
      }
    }
    setConnectPhase("connecting");

    // BlueZ often refuses the first attempts, so retry until the time is up
    const deadline =
      Date.now() + (watching ? CONNECT_TIMEOUT_MS : DIRECT_CONNECT_BUDGET_MS);
    let lastError: unknown;
    while (token === reconnectToken) {
      const remaining = deadline - Date.now();
      if (remaining < 500) break;
      try {
        await connectToDevice(known, token, remaining);
        rememberDevice(known);
        setConnectionState(ConnectionState.CONNECTED);
        return;
      } catch (error) {
        await abandonAttempt(known, token);
        if (token !== reconnectToken) return;
        console.warn("Connecting the last used device failed:", error);
        lastError = error;
        await sleep(RETRY_PAUSE_MS, signal);
      }
    }

    if (token !== reconnectToken) return;
    releaseDevice();
    const unreachable: ConnectionError = {
      kind: "unreachable",
      message: errorText(lastError),
    };
    if (hasUserActivation()) {
      chooseDevice(unreachable);
      return;
    }
    setConnectionState(ConnectionState.CONNECTION_FAILED);
    setConnectionError(unreachable);
  };

  return {
    connect,
    connectKnownDevice,
    knownDevice,
    knownDeviceInRange,
    rememberedDevice,
    reconnectAttempt,
    reconnectTotal,
    connectPhase,
    disconnect,
    reportStartFailure,
    connectionState,
    connectionError,
    deviceInfo,
    volcanoDriver,
    craftyDriver,
    ventyVeazyDriver,
  };
};

export const BluetoothProvider = (props: BluetoothProviderProps) => {
  const methods = createBluetoothMethods();

  return (
    <BluetoothContext.Provider value={methods}>
      {props.children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error("useBluetooth must be used within a BluetoothProvider");
  }
  return context;
};
