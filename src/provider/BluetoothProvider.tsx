import { createContext, createSignal, useContext } from "solid-js";
import type { JSX } from "solid-js";
import {
  ConnectionState,
  DeviceType,
  ServiceUUIDs,
  VentyVeazyCharacteristicUUIDs,
} from "../utils/uuids";
import { bluetoothQueue } from "../utils/bluetoothQueue";

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

  const [getVentyVeazyService, setVentyVeazyService] =
    createSignal<BluetoothRemoteGATTService>();

  //Crafty services
  const [getCraftyDeviceInfoService, setCraftyDeviceInfoService] =
    createSignal<BluetoothRemoteGATTService>();
  const [getCraftyControlService, setCraftyControlService] =
    createSignal<BluetoothRemoteGATTService>();
  const [getCraftyStatusService, setCraftyStatusService] =
    createSignal<BluetoothRemoteGATTService>();

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

  const handleDisconnect = (event: Event) => {
    console.log("🔌 Device disconnected unexpectedly:", event);
    // Clean up state after disconnect
    setConnectionState(ConnectionState.NOT_CONNECTED);
    setVolcanoStateService(undefined);
    setVolcanoControlService(undefined);
    setVentyVeazyService(undefined);
    setCraftyDeviceInfoService(undefined);
    setCraftyControlService(undefined);
    setCraftyStatusService(undefined);
    setCharacteristics({});
    setDeviceInfo({ type: DeviceType.UNKNOWN, name: "" });
    setServer(undefined);
    setDevice(undefined);
  };

  const disconnect = async () => {
    const characteristics = getCharacteristics();
    if (characteristics.control) {
      try {
        console.log("🛑 Stopping notifications on control characteristic");
        await characteristics.control.stopNotifications();
      } catch (error) {
        console.error("Error stopping notifications:", error);
      }
    }

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

    // Reset all state
    setConnectionState(ConnectionState.NOT_CONNECTED);

    setVolcanoStateService(undefined);
    setVolcanoControlService(undefined);
    // Venty/Veazy
    setVentyVeazyService(undefined);
    //Crafty
    setCraftyDeviceInfoService(undefined);
    setCraftyControlService(undefined);
    setCraftyStatusService(undefined);
    setCharacteristics({});
    setDeviceInfo({ type: DeviceType.UNKNOWN, name: "" });
    setServer(undefined);
    setDevice(undefined);
  };

  const connectToVeazyVenty = async (server: BluetoothRemoteGATTServer) => {
    try {
      const primaryService = await bluetoothQueue.add(() =>
        server.getPrimaryService(ServiceUUIDs.Primary)
      );
      if (!primaryService) throw new Error("Veazy/Venty service not found");
      setVentyVeazyService(primaryService); // Device-specific service

      // Initialize Veazy/Venty characteristics
      try {
        const controlCharacteristic = await bluetoothQueue.add(() =>
          primaryService.getCharacteristic(
            VentyVeazyCharacteristicUUIDs.control
          )
        );
        if (!controlCharacteristic) {
          throw new Error("Veazy/Venty control characteristic not found");
        }

        // First: Activate notifications
        await bluetoothQueue.add(() =>
          controlCharacteristic.startNotifications()
        );

        // Publish the characteristic before sending the init commands so the
        // hooks have attached their listeners and receive the responses.
        setCharacteristics({ control: controlCharacteristic });

        // Then: Send initialization commands
        await bluetoothQueue.add(async () => {
          for (const cmd of [0x02, 0x1d, 0x01, 0x04]) {
            const buffer = new ArrayBuffer(20);
            new DataView(buffer).setUint8(0, cmd);
            await controlCharacteristic.writeValue(buffer);
          }

          console.log(
            "Veazy/Venty initialization commands sent (0x02, 0x1D, 0x01, 0x04)"
          );
        });
      } catch (charError) {
        console.error(
          "Failed to get Veazy/Venty control characteristic:",
          charError
        );
        // Don't throw here, as the characteristic might not be available on all devices
      }
    } catch (error) {
      console.error("Failed to connect to Veazy/Venty service:", error);
      throw error;
    }
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
    console.log("Crafty: Connecting to Crafty device...");
    const craftyService1 = await getPrimaryService(
      server,
      ServiceUUIDs.Crafty1
    );
    const craftyService2 = await getPrimaryService(
      server,
      ServiceUUIDs.Crafty2
    );
    const craftyService3 = await getPrimaryService(
      server,
      ServiceUUIDs.Crafty3
    );
    // Crafty1: control, Crafty2: device info, Crafty3: status registers, usage time, etc.
    setCraftyControlService(craftyService1);
    setCraftyDeviceInfoService(craftyService2);
    setCraftyStatusService(craftyService3);
    console.log("Crafty: Crafty services connected successfully");
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
      await connectToVeazyVenty(server);
    } else if (actualDeviceType === DeviceType.CRAFTY) {
      console.log("Crafty: Detected Crafty device, connecting...");
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
    getVentyVeazyService,
    getCraftyControlService,
    getCraftyDeviceInfoService,
    getCraftyStatusService,
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
