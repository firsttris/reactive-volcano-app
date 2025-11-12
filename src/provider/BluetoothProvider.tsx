import { createContext, createSignal, useContext } from "solid-js";
import type { Accessor, JSX, Setter } from "solid-js";
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

export type Methods = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connectionState: () => ConnectionState;
  deviceInfo: () => DeviceInfo;
  getDeviceStateService: Accessor<BluetoothRemoteGATTService | undefined>;
  getDeviceControlService: Accessor<BluetoothRemoteGATTService | undefined>;
  getCraftyService1: Accessor<BluetoothRemoteGATTService | undefined>;
  getCraftyService2: Accessor<BluetoothRemoteGATTService | undefined>;
  getCraftyService3: Accessor<BluetoothRemoteGATTService | undefined>;
  getCharacteristics: Accessor<DeviceCharacteristics>;
  setCharacteristics: Setter<DeviceCharacteristics>;
};

export type DeviceInfo = {
  type: DeviceType;
  name: string;
  serialNumber?: string;
  firmwareVersion?: string;
};

const BluetoothContext = createContext<Methods>();

type BluetoothProviderProps = {
  children: JSX.Element;
};

export const BluetoothProvider = (props: BluetoothProviderProps) => {
  const [server, setServer] = createSignal<BluetoothRemoteGATTServer>();
  const [getDeviceStateService, setDeviceStateService] =
    createSignal<BluetoothRemoteGATTService>();
  const [getDeviceControlService, setDeviceControlService] =
    createSignal<BluetoothRemoteGATTService>();
  const [getCraftyService1, setCraftyService1] =
    createSignal<BluetoothRemoteGATTService>();
  const [getCraftyService2, setCraftyService2] =
    createSignal<BluetoothRemoteGATTService>();
  const [getCraftyService3, setCraftyService3] =
    createSignal<BluetoothRemoteGATTService>();
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
    const name = deviceName.toLowerCase();

    // Check for Venty (VY in device name)
    if (name.includes("vy") || name.includes("venty")) {
      return DeviceType.VENTY;
    }

    // Check for Veazy (VZ in device name)
    if (name.includes("vz") || name.includes("veazy")) {
      return DeviceType.VEAZY;
    }

    // Check for Crafty devices
    if (name.includes("crafty") || name.includes("cy")) {
      return DeviceType.CRAFTY;
    }

    // Check for Volcano devices
    if (
      name.includes("volcano") ||
      (name.includes("s&b") && name.includes("volcano"))
    ) {
      return DeviceType.VOLCANO;
    }

    // Fallback for other STORZ&BICKEL devices (likely Crafty/Volcano)
    if (name.includes("storz") || name.includes("s&b")) {
      return DeviceType.VOLCANO;
    }

    return DeviceType.UNKNOWN;
  };

  const disconnect = async () => {
    // First: Stop notifications on characteristics before disconnecting
    const characteristics = getCharacteristics();
    if (characteristics.control) {
      try {
        console.log("🛑 Stopping notifications on control characteristic");
        await characteristics.control.stopNotifications();
      } catch (error) {
        console.error("Error stopping notifications:", error);
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
    setDeviceStateService(undefined);
    setDeviceControlService(undefined);
    setCraftyService1(undefined);
    setCraftyService2(undefined);
    setCraftyService3(undefined);
    setCharacteristics({});
    setDeviceInfo({ type: DeviceType.UNKNOWN, name: "" });
    setServer(undefined);
  };

  const connectToDevice = async (
    device: BluetoothDevice,
    deviceType?: DeviceType
  ) => {
    if (!device.gatt) {
      throw new Error("Device does not support GATT");
    }

    // Set device info
    const deviceName = device.name || "";
    const actualDeviceType = deviceType || detectDeviceType(deviceName);
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
      // Veazy/Venty connection
      try {
        const primaryService = await server.getPrimaryService(
          ServiceUUIDs.Primary
        );
        setDeviceStateService(primaryService);
        setDeviceControlService(primaryService); // Same service for both

        // Initialize Veazy/Venty characteristics
        try {
          const controlCharacteristic = await primaryService.getCharacteristic(
            VentyVeazyCharacteristicUUIDs.control
          );

          // First: Activate notifications (like legacy app)
          await controlCharacteristic.startNotifications();

          // Then: Send initialization commands immediately (like legacy app)
          // This makes the device start sending data
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

            // CMD 0x04 - Extended data request (important!)
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
    } else if (actualDeviceType === DeviceType.CRAFTY) {
      // Crafty connection - directly connect to Crafty services (like legacy app)
      try {
        const service1 = await server.getPrimaryService(ServiceUUIDs.Crafty1);
        const service2 = await server.getPrimaryService(ServiceUUIDs.Crafty2);
        const service3 = await server.getPrimaryService(ServiceUUIDs.Crafty3);
        setCraftyService1(service1);
        setCraftyService2(service2);
        setCraftyService3(service3);
        // Use service1 as primary control service for compatibility
        setDeviceControlService(service1);
        console.log("Crafty services connected successfully");
      } catch (error) {
        console.error("Failed to connect to Crafty services:", error);
        throw new Error(
          `Crafty connection failed. This might be an incompatible firmware version (${deviceName}). Error: ${(error as Error).message}`
        );
      }
    } else {
      // Volcano connection (existing logic)
      const stateService = await server.getPrimaryService(
        ServiceUUIDs.DeviceState
      );
      setDeviceStateService(stateService);
      const controlService = await server.getPrimaryService(
        ServiceUUIDs.DeviceControl
      );
      setDeviceControlService(controlService);
    }
  };

  const getDeviceFilters = (storedDeviceName?: string) => {
    const baseFilters = [
      { namePrefix: "STORZ&BICKEL" },
      { namePrefix: "Storz&Bickel" },
      { namePrefix: "S&B" },
      // Separate filters for each device type (like legacy app)
      {
        services: [
          ServiceUUIDs.Crafty1,
          ServiceUUIDs.Crafty2,
          ServiceUUIDs.Crafty3,
        ],
      },
      {
        services: [
          ServiceUUIDs.DeviceState,
          ServiceUUIDs.DeviceControl,
          ServiceUUIDs.Service2,
          ServiceUUIDs.Service5,
        ],
      },
      {
        services: [ServiceUUIDs.Primary],
      },
    ];

    // For reconnect, add exact name match as first priority
    if (storedDeviceName) {
      return [{ name: storedDeviceName }, ...baseFilters];
    }

    return baseFilters;
  };

  const getOptionalServices = () => [
    "generic_access",
    ServiceUUIDs.GenericAccess, // Generic Access for Veazy/Venty
    ServiceUUIDs.Primary, // Veazy/Venty primary service
    ServiceUUIDs.DeviceState, // Volcano services
    ServiceUUIDs.DeviceControl,
    ServiceUUIDs.Crafty1, // Crafty services
    ServiceUUIDs.Crafty2,
    ServiceUUIDs.Crafty3,
  ];

  const requestBluetoothDevice = async (storedDeviceName?: string) => {
    return navigator.bluetooth.requestDevice({
      filters: getDeviceFilters(storedDeviceName),
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
      if (error instanceof Error) alert(error.message);
    }
  };

  return (
    <BluetoothContext.Provider
      value={{
        connect,
        disconnect,
        connectionState,
        deviceInfo,
        getDeviceStateService,
        getDeviceControlService,
        getCraftyService1,
        getCraftyService2,
        getCraftyService3,
        getCharacteristics,
        setCharacteristics,
      }}
    >
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
