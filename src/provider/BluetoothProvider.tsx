import { createContext, createSignal, useContext } from "solid-js";
import type { Accessor, JSX, Setter } from "solid-js";
import {
  ConnectionState,
  ServiceUUIDs,
  VolcanoCharacteristics,
  initialCharacteristics,
} from "../utils/uuids";

export type Methods = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connectionState: () => ConnectionState;
  getDeviceStateService: Accessor<BluetoothRemoteGATTService | undefined>;
  getDeviceControlService: Accessor<BluetoothRemoteGATTService | undefined>;
  getCharacteristics: Accessor<VolcanoCharacteristics>;
  setCharacteristics: Setter<VolcanoCharacteristics>;
};

const BluetoothContext = createContext<Methods>();

type BluetoothProviderProps = {
  children: JSX.Element;
};

export const BluetoothProvider = (props: BluetoothProviderProps) => {
  const [ server, setServer ] = createSignal<BluetoothRemoteGATTServer>();
  const [getDeviceStateService, setDeviceStateService] = createSignal<BluetoothRemoteGATTService>();
  const [getDeviceControlService, setDeviceControlService] = createSignal<BluetoothRemoteGATTService>();
  const [getCharacteristics, setCharacteristics] =
    createSignal<VolcanoCharacteristics>(initialCharacteristics);

  const [connectionState, setConnectionState] = createSignal<ConnectionState>(
    ConnectionState.NOT_CONNECTED
  );

  const disconnect = async () => {
    const currentServer = server();
    if(!currentServer) {
      console.log("No Gatt Server Connected"); 
      return;
    }
    await currentServer.disconnect();
    setConnectionState(ConnectionState.NOT_CONNECTED);
    setDeviceStateService(undefined);
    setDeviceControlService(undefined);
  }

  const connect = async () => {
    setConnectionState(ConnectionState.CONNECTING);
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: "STORZ&BICKEL" },
          { namePrefix: "Storz&Bickel" },
          { namePrefix: "S&B" },
          { services: [ServiceUUIDs.DeviceState, ServiceUUIDs.DeviceControl] },
        ],
        acceptAllDevices: false,
      });

      if (!device.gatt) {
        console.error("Device does not support gatt");
        return;
      }
     
      const server = await device.gatt.connect();
      setServer(server)
      const stateService = await server.getPrimaryService(
        ServiceUUIDs.DeviceState
      );
      setDeviceStateService(stateService);
      const controlService = await server.getPrimaryService(
        ServiceUUIDs.DeviceControl
      );
      setDeviceControlService(controlService);
    } catch (error) {
      console.error((error as Error).message);
      setConnectionState(ConnectionState.CONNECTION_FAILED);
      alert((error as Error).message)
      return;
    }
    setConnectionState(ConnectionState.CONNECTED);
  };
  return (
    <BluetoothContext.Provider
      value={{
        connect,
        disconnect,
        connectionState,
        getDeviceStateService,
        getDeviceControlService,
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
