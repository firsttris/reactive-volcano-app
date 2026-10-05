import type { JSX } from "solid-js";
import { createContext, createSignal, useContext } from "solid-js";
import { type CraftyDriver, connectCrafty } from "../devices/crafty/driver";
import {
  connectVentyVeazy,
  type VentyVeazyDriver,
} from "../devices/ventyVeazy/driver";
import { connectVolcano, type VolcanoDriver } from "../devices/volcano/driver";
import {
  connectGatt,
  sleep,
  waitForAdvertisement,
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

const NO_DEVICE: DeviceInfo = { type: DeviceType.UNKNOWN, name: "" };

/** Waits between reconnect attempts; the device may need a moment */
export const RECONNECT_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 8_000];

/** How long to listen for the last used device before connecting anyway */
const ADVERTISEMENT_TIMEOUT_MS = 10_000;
/** Retries of the direct connect; BlueZ often refuses the first attempts */
const KNOWN_DEVICE_RETRY_DELAYS_MS = [0, 1_500, 3_000, 5_000];
/** A GATT connect that takes longer has failed */
const CONNECT_TIMEOUT_MS = 12_000;

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
      if (currentDevice.gatt?.connected) currentDevice.gatt.disconnect();
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

    for (const [index, delay] of RECONNECT_DELAYS_MS.entries()) {
      setReconnectAttempt(index + 1);
      // Connect as soon as the device advertises again; without support for
      // watching, wait the planned time
      const seen = await waitForAdvertisement(
        bluetoothDevice,
        delay + 2_000,
        signal
      );
      if (seen === "unsupported") await sleep(delay, signal);
      if (token !== reconnectToken) return;
      try {
        await connectToDevice(bluetoothDevice);
        if (token !== reconnectToken) return;
        setReconnectAttempt(0);
        setConnectionState(ConnectionState.CONNECTED);
        return;
      } catch (error) {
        console.warn(`Reconnect attempt ${index + 1} failed:`, error);
        await abandonAttempt(bluetoothDevice);
      }
    }

    if (token !== reconnectToken) return;
    setReconnectAttempt(0);
    releaseDevice();
    setConnectionState(ConnectionState.NOT_CONNECTED);
    setConnectionError({ kind: "lost" });
  };

  /** Cleans up after a failed connect so the next attempt starts fresh */
  const abandonAttempt = async (bluetoothDevice: BluetoothDevice) => {
    bluetoothDevice.removeEventListener(
      "gattserverdisconnected",
      handleDisconnect
    );
    await disposeDrivers();
    if (bluetoothDevice.gatt?.connected) bluetoothDevice.gatt.disconnect();
  };

  const disconnect = async () => {
    startAttempt();
    setReconnectAttempt(0);
    setConnectionError(undefined);
    await disposeDrivers();
    releaseDevice();
    setConnectionState(ConnectionState.NOT_CONNECTED);
  };

  const connectToDevice = async (bluetoothDevice: BluetoothDevice) => {
    if (!bluetoothDevice.gatt) {
      throw new Error("Device does not support GATT");
    }
    setDevice(bluetoothDevice);
    // Critical for handling unexpected disconnects
    bluetoothDevice.addEventListener(
      "gattserverdisconnected",
      handleDisconnect
    );

    const name = bluetoothDevice.name || "";
    const type = detectDeviceType(name);
    setDeviceInfo({ type, name });

    const server = await connectGatt(bluetoothDevice, CONNECT_TIMEOUT_MS);

    switch (type) {
      case DeviceType.VOLCANO: {
        const driver = await connectVolcano(server, bluetoothQueue);
        setDeviceInfo({
          type,
          name,
          serialNumber: driver.info.serialNumber,
          firmwareVersion: driver.info.firmwareVersion,
        });
        setVolcanoDriver(driver);
        break;
      }
      case DeviceType.VENTY:
      case DeviceType.VEAZY: {
        const model = type === DeviceType.VEAZY ? "VEAZY" : "VENTY";
        // Serial number is part of the name: "S&B VY123456"
        setDeviceInfo({ type, name, serialNumber: name.split(" ")[1] });
        setVentyVeazyDriver(
          await connectVentyVeazy(server, model, bluetoothQueue)
        );
        break;
      }
      default: {
        const driver = await connectCrafty(server, bluetoothQueue);
        setDeviceInfo({
          type,
          name,
          serialNumber: driver.serialNumber || undefined,
          firmwareVersion: driver.firmwareVersion,
        });
        setCraftyDriver(driver);
      }
    }
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

  const runConnect = async (pickDevice: () => Promise<BluetoothDevice>) => {
    startAttempt();
    setConnectPhase("connecting");
    setConnectionState(ConnectionState.CONNECTING);
    setConnectionError(undefined);
    try {
      const bluetoothDevice = await pickDevice();
      await connectToDevice(bluetoothDevice);
      rememberDevice(bluetoothDevice);
      setConnectionState(ConnectionState.CONNECTED);
    } catch (error) {
      console.error("Connection failed:", error);
      await disposeDrivers();
      releaseDevice();
      setConnectionState(ConnectionState.CONNECTION_FAILED);

      // Closing the device chooser is not an error worth showing
      const userCancelled =
        error instanceof DOMException && error.name === "NotFoundError";
      if (!userCancelled) {
        setConnectionError({
          kind: "failed",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  };

  /** Shows the browser's device chooser */
  const connect = () =>
    runConnect(() =>
      navigator.bluetooth.requestDevice({
        filters: getDeviceFilters(),
        acceptAllDevices: false,
        optionalServices: ["generic_access", ServiceUUIDs.GenericAccess],
      })
    );

  /**
   * Connects the last used device without the chooser. The system only
   * connects a device it has recently seen advertising, so listen for it
   * first, then retry a few times: right after a disconnect or after a long
   * idle period the first attempts often fail (notably with BlueZ on Linux).
   */
  const connectKnownDevice = async () => {
    const known = knownDevice();
    if (!known) return;
    const { token, signal } = startAttempt();
    setConnectionError(undefined);
    setConnectionState(ConnectionState.CONNECTING);
    setConnectPhase("searching");

    await waitForAdvertisement(known, ADVERTISEMENT_TIMEOUT_MS, signal);
    if (token !== reconnectToken) return;
    setConnectPhase("connecting");

    let lastError: unknown;
    for (const delay of KNOWN_DEVICE_RETRY_DELAYS_MS) {
      if (delay) await sleep(delay, signal);
      if (token !== reconnectToken) return;
      try {
        await connectToDevice(known);
        if (token !== reconnectToken) {
          // Cancelled while the connect was still running
          await abandonAttempt(known);
          return;
        }
        rememberDevice(known);
        setConnectionState(ConnectionState.CONNECTED);
        return;
      } catch (error) {
        console.warn("Connecting the last used device failed:", error);
        lastError = error;
        await abandonAttempt(known);
      }
    }

    if (token !== reconnectToken) return;
    releaseDevice();
    setConnectionState(ConnectionState.CONNECTION_FAILED);
    setConnectionError({
      kind: "unreachable",
      message:
        lastError instanceof Error ? lastError.message : String(lastError),
    });
  };

  return {
    connect,
    connectKnownDevice,
    knownDevice,
    rememberedDevice,
    reconnectAttempt,
    connectPhase,
    disconnect,
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
