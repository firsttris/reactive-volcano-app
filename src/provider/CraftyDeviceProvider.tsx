import { createContext, useContext, JSX } from "solid-js";
import { useTemperature } from "../hooks/crafty/useTemperature";
import { useDeviceStatus } from "../hooks/crafty/useDeviceStatus";
import { useBrightness } from "../hooks/crafty/useBrightness";
import { useShutdowntime } from "../hooks/crafty/useShutdowntime";
import { useDeviceInformation } from "../hooks/crafty/useDeviceInformation";
import { useHeatingTime } from "../hooks/crafty/useHeatingTime";

type CraftyDeviceContextType = {
  temperature: ReturnType<typeof useTemperature>;
  deviceStatus: ReturnType<typeof useDeviceStatus>;
  brightness: ReturnType<typeof useBrightness>;
  shutdowntime: ReturnType<typeof useShutdowntime>;
  deviceInformation: ReturnType<typeof useDeviceInformation>;
  heatingTime: ReturnType<typeof useHeatingTime>;
};

const CraftyDeviceContext = createContext<CraftyDeviceContextType>();

type CraftyDeviceProviderProps = {
  children: JSX.Element;
};

export const CraftyDeviceProvider = (props: CraftyDeviceProviderProps) => {
  // Alle Bluetooth-Hooks werden hier zentral einmal instanziiert
  const temperature = useTemperature();
  const deviceStatus = useDeviceStatus();
  const brightness = useBrightness();
  const shutdowntime = useShutdowntime();
  const deviceInformation = useDeviceInformation();
  const heatingTime = useHeatingTime();

  return (
    <CraftyDeviceContext.Provider
      value={{
        temperature,
        deviceStatus,
        brightness,
        shutdowntime,
        deviceInformation,
        heatingTime,
      }}
    >
      {props.children}
    </CraftyDeviceContext.Provider>
  );
};

export const useCraftyDevice = () => {
  const context = useContext(CraftyDeviceContext);
  if (!context) {
    throw new Error(
      "useCraftyDevice must be used within a CraftyDeviceProvider"
    );
  }
  return context;
};
