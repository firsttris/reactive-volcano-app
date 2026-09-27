import { createContext, createSignal, useContext } from "solid-js";
import type { JSX } from "solid-js";
import {
  ConnectionState,
  DeviceType,
  ServiceUUIDs,
  VentyVeazyCharacteristicUUIDs,
} from "../utils/uuids";
import { bluetoothQueue } from "../utils/bluetoothQueue";
import {
  connectVentyVeazy,
  type VentyVeazyDriver,
} from "../devices/ventyVeazy/driver";
import type { VentyVeazyModel } from "../devices/ventyVeazy/protocol";
import { connectCrafty, type CraftyDriver } from "../devices/crafty/driver";

type DeviceCharacteristics = Record<
  string,
  BluetoothRemoteGATTCharacteristic | undefined
>;

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

const createBluetoothMethods = () => {
  const [device, setDevice] = createSignal<BluetoothDevice>();
  const [server, setServer] = createSignal<BluetoothRemoteGATTServer>();

  // Volcano services
  const [getVolcanoStateService, setVolcanoStateService] =
    createSignal<BluetoothRemoteGATTService>();
  const [getVolcanoControlService, setVolcanoControlService] =
    createSignal<BluetoothRemoteGATTService>();

  const [ventyVeazyDriver, setVentyVeazyDriver] =
    createSignal<VentyVeazyDriver>();

  const [craftyDriver, setCraftyDriver] = createSignal<CraftyDriver>();

  const isIOS = () => {
    return (
      navigator.userAgent.includes("iPhone") ||
      navigator.userAgent.includes("iPad") ||
      navigator.userAgent.includes("WebBLE/1")
    );
  };

  const [getCharacteristics, setCharacteristics] =
    createSignal<DeviceCharacteristics>({});

  const [connectionState, setConnectionState] = createSignal<ConnectionState>(
    ConnectionState.NOT_CONNECTED
  );

  const [deviceInfo, setDeviceInfo] = createSignal<DeviceInfo>({
    type: DeviceType.UNKNOWN,
    name: "",
  });

  const detectDeviceType = (deviceName: string): DeviceType => {
    if (deviceName.includes("S&B VOLCANO")) {
      return DeviceType.VOLCANO;
    }
    if (deviceName.includes("S&B VY")) {
      return DeviceType.VENTY;
    }
    if (deviceName.includes("S&B VZ")) {
      return DeviceType.VEAZY;
    }
    return DeviceType.CRAFTY;
  };

  const resetState = () => {
    setConnectionState(ConnectionState.NOT_CONNECTED);
    setVolcanoStateService(undefined);
    setVolcanoControlService(undefined);
    setCraftyDriver(undefined);
    setVentyVeazyDriver(undefined);
    setCharacteristics({});
    setDeviceInfo({ type: DeviceType.UNKNOWN, name: "" });
    setServer(undefined);
    setDevice(undefined);
  };

  const disposeDrivers = async () => {
    await ventyVeazyDriver()?.dispose();
    await craftyDriver()?.dispose();
  };

  const handleDisconnect = (event: Event) => {
    console.log("🔌 Device disconnected unexpectedly:", event);
    disposeDrivers();
    resetState();
  };

  const disconnect = async () => {
    await disposeDrivers();

    // Remove event listener before disconnecting
    const currentDevice = device();
    if (currentDevice) {
      try {
        currentDevice.removeEventListener(
          "gattserverdisconnected",
          handleDisconnect
        );
      } catch (error) {
        console.error("Error removing disconnect listener:", error);
      }
    }

    const currentServer = server();
    if (currentServer) {
      try {
        await currentServer.disconnect();
      } catch (error) {
        console.error("Error during disconnect:", error);
      }
    }

    resetState();
  };

  const connectToVeazyVenty = async (
    server: BluetoothRemoteGATTServer,
    model: VentyVeazyModel
  ) => {
    const service = await getPrimaryService(server, ServiceUUIDs.Primary);
    const driver = await connectVentyVeazy(
      service,
      VentyVeazyCharacteristicUUIDs.control,
      model,
      bluetoothQueue
    );
    // The VentyVeazyProvider subscribes to the driver and then starts it
    setVentyVeazyDriver(driver);
  };

  const getPrimaryService = async (
    server: BluetoothRemoteGATTServer,
    uuid: string
  ) => {
    const service = await bluetoothQueue.add(() =>
      server.getPrimaryService(uuid)
    );
    if (!service) throw new Error(`Service ${uuid} not found`);
    return service;
  };

  const connectToCrafty = async (server: BluetoothRemoteGATTServer) => {
    const driver = await connectCrafty(server, bluetoothQueue);
    // The CraftyProvider subscribes to the driver and then starts it
    setCraftyDriver(driver);
  };

  const connectToVolcano = async (server: BluetoothRemoteGATTServer) => {
    const stateService = await getPrimaryService(
      server,
      ServiceUUIDs.DeviceState
    );
    const controlService = await getPrimaryService(
      server,
      ServiceUUIDs.DeviceControl
    );
    setVolcanoStateService(stateService); // Device-specific state service
    setVolcanoControlService(controlService); // Device-specific control service
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    if (!device.gatt) {
      throw new Error("Device does not support GATT");
    }

    // Set device reference first
    setDevice(device);

    // Add disconnect event listener (critical for handling unexpected disconnects!)
    device.addEventListener("gattserverdisconnected", handleDisconnect);

    // Set device info
    const deviceName = device.name || "";
    const actualDeviceType = detectDeviceType(deviceName);
    setDeviceInfo({
      type: actualDeviceType,
      name: deviceName,
    });

    const server = await device.gatt.connect();
    setServer(server);

    // Connect based on device type
    if (
      actualDeviceType === DeviceType.VEAZY ||
      actualDeviceType === DeviceType.VENTY
    ) {
      await connectToVeazyVenty(
        server,
        actualDeviceType === DeviceType.VEAZY ? "VEAZY" : "VENTY"
      );
    } else if (actualDeviceType === DeviceType.CRAFTY) {
      await connectToCrafty(server);
    } else {
      await connectToVolcano(server);
    }
  };

  const getDeviceFilters = () => {
    if (isIOS()) {
      // On iOS, only use namePrefix filters as services are not supported
      return [
        { namePrefix: "STORZ&BICKEL" },
        { namePrefix: "Storz&Bickel" },
        { namePrefix: "S&B" },
      ];
    } else {
      // On Android/Desktop, use both namePrefix and services
      const baseFilters = [
        { namePrefix: "STORZ&BICKEL" },
        { namePrefix: "Storz&Bickel" },
        { namePrefix: "S&B" },
        {
          services: [
            ServiceUUIDs.Crafty1,
            ServiceUUIDs.Crafty2,
            ServiceUUIDs.Crafty3,
          ],
        }, // Crafty services
        { services: [ServiceUUIDs.DeviceState, ServiceUUIDs.DeviceControl] }, // Volcano services
        { services: [ServiceUUIDs.Primary] }, // Veazy/Venty service
      ];

      return baseFilters;
    }
  };

  const getOptionalServices = () => [
    "generic_access",
    ServiceUUIDs.GenericAccess,
  ];

  const requestBluetoothDevice = async () => {
    return navigator.bluetooth.requestDevice({
      filters: getDeviceFilters(),
      acceptAllDevices: false,
      optionalServices: getOptionalServices(),
    });
  };

  const connect = async () => {
    setConnectionState(ConnectionState.CONNECTING);
    try {
      const device = await requestBluetoothDevice();
      await connectToDevice(device);
      setConnectionState(ConnectionState.CONNECTED);
    } catch (error) {
      console.error("Connection failed:", error);
      setConnectionState(ConnectionState.CONNECTION_FAILED);

      // Clean up device reference on connection failure
      const currentDevice = device();
      if (currentDevice) {
        currentDevice.removeEventListener(
          "gattserverdisconnected",
          handleDisconnect
        );
        setDevice(undefined);
      }

      // Closing the device chooser is not an error worth an alert
      const userCancelled =
        error instanceof DOMException && error.name === "NotFoundError";
      if (error instanceof Error && !userCancelled) alert(error.message);
    }
  };

  return {
    connect,
    disconnect,
    connectionState,
    deviceInfo,
    getVolcanoStateService,
    getVolcanoControlService,
    ventyVeazyDriver,
    craftyDriver,
    getCharacteristics,
    setCharacteristics,
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
