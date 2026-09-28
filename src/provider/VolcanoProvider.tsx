import type { JSX } from "solid-js";
import { createContext, Show, useContext } from "solid-js";
import type { VolcanoDriver } from "../devices/volcano/driver";
import {
  createVolcanoStore,
  type VolcanoStore,
} from "../devices/volcano/store";
import { useBluetooth } from "./BluetoothProvider";

const VolcanoContext = createContext<VolcanoStore>();

const VolcanoStoreProvider = (props: {
  driver: VolcanoDriver;
  children: JSX.Element;
}) => {
  // Read once on purpose: one store per driver instance
  const store = createVolcanoStore(props.driver);
  return (
    <VolcanoContext.Provider value={store}>
      {props.children}
    </VolcanoContext.Provider>
  );
};

/** Renders its children only while a Volcano is connected */
export const VolcanoProvider = (props: { children: JSX.Element }) => {
  const { volcanoDriver } = useBluetooth();
  return (
    <Show when={volcanoDriver()} keyed>
      {(driver) => (
        <VolcanoStoreProvider driver={driver}>
          {props.children}
        </VolcanoStoreProvider>
      )}
    </Show>
  );
};

export const useVolcano = () => {
  const context = useContext(VolcanoContext);
  if (!context) {
    throw new Error("useVolcano must be used within a VolcanoProvider");
  }
  return context;
};
