import type { JSX } from "solid-js";
import { createContext, Show, useContext } from "solid-js";
import type { VentyVeazyDriver } from "../devices/ventyVeazy/driver";
import {
  createVentyVeazyStore,
  type VentyVeazyStore,
} from "../devices/ventyVeazy/store";
import { useBluetooth } from "./BluetoothProvider";

const VentyVeazyContext = createContext<VentyVeazyStore>();

const VentyVeazyStoreProvider = (props: {
  driver: VentyVeazyDriver;
  children: JSX.Element;
}) => {
  // Read once on purpose: one store per driver instance
  const store = createVentyVeazyStore(props.driver);
  return (
    <VentyVeazyContext.Provider value={store}>
      {props.children}
    </VentyVeazyContext.Provider>
  );
};

/** Renders its children only while a Venty/Veazy is connected */
export const VentyVeazyProvider = (props: { children: JSX.Element }) => {
  const { ventyVeazyDriver } = useBluetooth();
  return (
    <Show when={ventyVeazyDriver()} keyed>
      {(driver) => (
        <VentyVeazyStoreProvider driver={driver}>
          {props.children}
        </VentyVeazyStoreProvider>
      )}
    </Show>
  );
};

export const useVentyVeazy = () => {
  const context = useContext(VentyVeazyContext);
  if (!context) {
    throw new Error("useVentyVeazy must be used within a VentyVeazyProvider");
  }
  return context;
};
