import type { JSX } from "solid-js";
import { createContext, createSignal, useContext } from "solid-js";
import { type CraftyDriver, connectCrafty } from "../devices/crafty/driver";
import {
  connectVentyVeazy,
  type VentyVeazyDriver,
} from "../devices/ventyVeazy/driver";
import { connectVolcano, type VolcanoDriver } from "../devices/volcano/driver";
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
  | { kind: "lost" };

const NO_DEVICE: DeviceInfo = { type: DeviceType.UNKNOWN, name: "" };

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
    disposeDrivers();
    releaseDevice();
    setConnectionState(ConnectionState.NOT_CONNECTED);
    setConnectionError({ kind: "lost" });
  }

  const disconnect = async () => {
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

    const server = await bluetoothDevice.gatt.connect();

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

  const connect = async () => {
    setConnectionState(ConnectionState.CONNECTING);
    setConnectionError(undefined);
    try {
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: getDeviceFilters(),
        acceptAllDevices: false,
        optionalServices: ["generic_access", ServiceUUIDs.GenericAccess],
      });
      await connectToDevice(bluetoothDevice);
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

  return {
    connect,
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
