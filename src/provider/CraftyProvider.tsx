import { createContext, Show, useContext } from "solid-js";
import type { JSX } from "solid-js";
import { useBluetooth } from "./BluetoothProvider";
import type { CraftyDriver } from "../devices/crafty/driver";
import { createCraftyStore, type CraftyStore } from "../devices/crafty/store";

const CraftyContext = createContext<CraftyStore>();

const CraftyStoreProvider = (props: {
  driver: CraftyDriver;
  children: JSX.Element;
}) => {
  // eslint-disable-next-line solid/reactivity -- one store per driver instance
  const store = createCraftyStore(props.driver);
  return (
    <CraftyContext.Provider value={store}>
      {props.children}
    </CraftyContext.Provider>
  );
};

/** Renders its children only while a Crafty is connected */
export const CraftyProvider = (props: { children: JSX.Element }) => {
  const { craftyDriver } = useBluetooth();
  return (
    <Show when={craftyDriver()} keyed>
      {(driver) => (
        <CraftyStoreProvider driver={driver}>
          {props.children}
        </CraftyStoreProvider>
      )}
    </Show>
  );
};

export const useCrafty = () => {
  const context = useContext(CraftyContext);
  if (!context) {
    throw new Error("useCrafty must be used within a CraftyProvider");
  }
  return context;
};
