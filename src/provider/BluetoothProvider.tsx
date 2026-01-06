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
      const primaryService = await server.getPrimaryService(
        ServiceUUIDs.Primary
      );
      setVentyVeazyService(primaryService); // Device-specific service

      // Initialize Veazy/Venty characteristics
      try {
        const controlCharacteristic = await primaryService.getCharacteristic(
          VentyVeazyCharacteristicUUIDs.control
        );

        // First: Activate notifications
        await controlCharacteristic.startNotifications();

        // Then: Send initialization commands
        await bluetoothQueue.add(async () => {
          // CMD 0x02 - Reset/Initialize
          const resetBuffer = new ArrayBuffer(20);
          const resetView = new DataView(resetBuffer);
          resetView.setUint8(0, 0x02);
          await controlCharacteristic.writeValue(resetBuffer);

          // CMD 0x1D - Status request
          const statusBuffer = new ArrayBuffer(20);
          const statusView = new DataView(statusBuffer);
          statusView.setUint8(0, 0x1d);
          await controlCharacteristic.writeValue(statusBuffer);

          // CMD 0x01 - Basic data request
          const basicBuffer = new ArrayBuffer(20);
          const basicView = new DataView(basicBuffer);
          basicView.setUint8(0, 0x01);
          await controlCharacteristic.writeValue(basicBuffer);

          // CMD 0x04 - Extended data request
          const extendedBuffer = new ArrayBuffer(20);
          const extendedView = new DataView(extendedBuffer);
          extendedView.setUint8(0, 0x04);
          await controlCharacteristic.writeValue(extendedBuffer);

          console.log(
            "Veazy/Venty initialization commands sent (0x02, 0x1D, 0x01, 0x04)"
          );
        });

        setCharacteristics({ control: controlCharacteristic });
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

  const connectToCrafty = async (server: BluetoothRemoteGATTServer) => {
    console.log("Crafty: Connecting to Crafty device...");
    const craftyService1 = await server.getPrimaryService(ServiceUUIDs.Crafty1);
    console.log("Crafty: Got Crafty1 service", craftyService1);
    setCraftyControlService(craftyService1);
    const craftyService2 = await server.getPrimaryService(ServiceUUIDs.Crafty2);
    console.log("Crafty: Got Crafty2 service", craftyService2);
    // Assuming Crafty2 is control service, adjust as needed
    setCraftyDeviceInfoService(craftyService2);
    const craftyService3 = await server.getPrimaryService(ServiceUUIDs.Crafty3);
    console.log("Crafty: Got Crafty3 service", craftyService3);
    // Crafty3 is used for additional characteristics like status registers, usage time, etc.
    setCraftyStatusService(craftyService3);
    console.log("Crafty: Crafty services connected successfully");
  };

  const connectToVolcano = async (server: BluetoothRemoteGATTServer) => {
    const stateService = await server.getPrimaryService(
      ServiceUUIDs.DeviceState
    );
    setVolcanoStateService(stateService); // Device-specific state service
    const controlService = await server.getPrimaryService(
      ServiceUUIDs.DeviceControl
    );
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
      
      if (error instanceof Error) alert(error.message);
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
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
