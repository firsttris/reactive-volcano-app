import { createContext, useContext, JSX } from "solid-js";
import { useTemperature } from "../hooks/volcano/useTemperature";
import { useDeviceStatus } from "../hooks/volcano/useDeviceStatus";
import { useBrightness } from "../hooks/volcano/useBrightness";
import { useVibration } from "../hooks/volcano/useVibration";
import { useShutdowntime } from "../hooks/volcano/useShutdowntime";
import { useDeviceSetting } from "../hooks/volcano/useDeviceSettings";
import { useHeatingTime } from "../hooks/volcano/useHeatingTime";
import { useDeviceInformation } from "../hooks/volcano/useDeviceInformation";
import { useWorkflow } from "../hooks/volcano/useWorkflow";

type VolcanoDeviceContextType = {
  temperature: ReturnType<typeof useTemperature>;
  deviceStatus: ReturnType<typeof useDeviceStatus>;
  brightness: ReturnType<typeof useBrightness>;
  vibration: ReturnType<typeof useVibration>;
  shutdowntime: ReturnType<typeof useShutdowntime>;
  deviceSetting: ReturnType<typeof useDeviceSetting>;
  heatingTime: ReturnType<typeof useHeatingTime>;
  deviceInformation: ReturnType<typeof useDeviceInformation>;
  workflow: ReturnType<typeof useWorkflow>;
};

const VolcanoDeviceContext = createContext<VolcanoDeviceContextType>();

type VolcanoDeviceProviderProps = {
  children: JSX.Element;
};

export const VolcanoDeviceProvider = (props: VolcanoDeviceProviderProps) => {
  // Alle Bluetooth-Hooks werden hier zentral einmal instanziiert
  const temperature = useTemperature();
  const deviceStatus = useDeviceStatus();
  const brightness = useBrightness();
  const vibration = useVibration();
  const shutdowntime = useShutdowntime();
  const deviceSetting = useDeviceSetting();
  const heatingTime = useHeatingTime();
  const deviceInformation = useDeviceInformation();
  const workflow = useWorkflow();

  return (
    <VolcanoDeviceContext.Provider
      value={{
        temperature,
        deviceStatus,
        brightness,
        vibration,
        shutdowntime,
        deviceSetting,
        heatingTime,
        deviceInformation,
        workflow,
      }}
    >
      {props.children}
    </VolcanoDeviceContext.Provider>
  );
};

export const useVolcanoDeviceContext = () => {
  const context = useContext(VolcanoDeviceContext);
  if (!context) {
    throw new Error(
      "useVolcanoDeviceContext must be used within a VolcanoDeviceProvider"
    );
  }
  return context;
};
