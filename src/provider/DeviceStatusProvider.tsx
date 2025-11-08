import { createContext, useContext } from "solid-js";
import type { JSX } from "solid-js";
import { useDeviceStatus } from "../hooks/venty-veazy/useDeviceStatus";

type DeviceStatusContextType = ReturnType<typeof useDeviceStatus>;

const DeviceStatusContext = createContext<DeviceStatusContextType>();

type DeviceStatusProviderProps = {
  children: JSX.Element;
  pollInterval?: number;
};

export const DeviceStatusProvider = (props: DeviceStatusProviderProps) => {
  const deviceStatus = useDeviceStatus(props.pollInterval);

  return (
    <DeviceStatusContext.Provider value={deviceStatus}>
      {props.children}
    </DeviceStatusContext.Provider>
  );
};

export const useDeviceStatusContext = () => {
  const context = useContext(DeviceStatusContext);
  if (!context) {
    throw new Error(
      "useDeviceStatusContext must be used within a DeviceStatusProvider"
    );
  }
  return context;
};
