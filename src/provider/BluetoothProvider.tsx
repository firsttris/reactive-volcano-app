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
  getService3: Accessor<BluetoothRemoteGATTService | undefined>;
  getService4: Accessor<BluetoothRemoteGATTService | undefined>;
  getCharacteristics: Accessor<VolcanoCharacteristics>;
  setCharacteristics: Setter<VolcanoCharacteristics>;
};

const BluetoothContext = createContext<Methods>();

type BluetoothProviderProps = {
  children: JSX.Element;
};

export const BluetoothProvider = (props: BluetoothProviderProps) => {
  const [ server, setServer ] = createSignal<BluetoothRemoteGATTServer>();
  const [getService3, setService3] = createSignal<BluetoothRemoteGATTService>();
  const [getService4, setService4] = createSignal<BluetoothRemoteGATTService>();
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
    setService3(undefined);
    setService4(undefined);
  }

  const connect = async () => {
    setConnectionState(ConnectionState.CONNECTING);
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: "STORZ&BICKEL" },
          { namePrefix: "Storz&Bickel" },
          { namePrefix: "S&B" },
          { services: [ServiceUUIDs.Service3, ServiceUUIDs.Service4] },
        ],
        acceptAllDevices: false,
      });

      if (!device.gatt) {
        console.error("Device does not support gatt");
        return;
      }
     
      const server = await device.gatt.connect();
      setServer(server)
      const vulcanoSerivce3 = await server.getPrimaryService(
        ServiceUUIDs.Service3
      );
      setService3(vulcanoSerivce3);
      const vulcanoSerivce4 = await server.getPrimaryService(
        ServiceUUIDs.Service4
      );
      setService4(vulcanoSerivce4);
    } catch (error) {
      console.error("Failed to connect to device", error);
      setConnectionState(ConnectionState.CONNECTION_FAILED);
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
        getService3,
        getService4,
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
