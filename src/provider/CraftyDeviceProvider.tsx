import { createContext, useContext, JSX } from "solid-js";
import { useTemperature } from "../hooks/crafty/useTemperature";
import { usePower } from "../hooks/crafty/usePower";
import { useSettings } from "../hooks/crafty/useSettings";
import { useSystemStatus } from "../hooks/crafty/useSystemStatus";
import { useFirmware } from "../hooks/crafty/useFirmware";
import { useUsageTime } from "../hooks/crafty/useUsageTime";
import { useProjectRegister } from "../hooks/crafty/useProjectRegister";

type CraftyDeviceContextType = {
  temperature: ReturnType<typeof useTemperature>;
  power: ReturnType<typeof usePower>;
  settings: ReturnType<typeof useSettings>;
  systemStatus: ReturnType<typeof useSystemStatus>;
  firmware: ReturnType<typeof useFirmware>;
  usageTime: ReturnType<typeof useUsageTime>;
  projectRegister: ReturnType<typeof useProjectRegister>;
};

const CraftyDeviceContext = createContext<CraftyDeviceContextType>();

type CraftyDeviceProviderProps = {
  children: JSX.Element;
};

export const CraftyDeviceProvider = (props: CraftyDeviceProviderProps) => {
  console.log("Crafty Device Provider: Initializing Crafty device provider");
  
  // Initialize firmware hook first to determine device capabilities
  const firmware = useFirmware();
  const isOldCrafty = firmware.isOldCrafty;
  
  // Pass isOldCrafty to hooks that need conditional logic
  const temperature = useTemperature();
  const power = usePower({ isOldCrafty });
  const settings = useSettings({ isOldCrafty });
  const systemStatus = useSystemStatus({ isOldCrafty });
  const usageTime = useUsageTime({ isOldCrafty });
  const projectRegister = useProjectRegister();

  return (
    <CraftyDeviceContext.Provider
      value={{
        temperature,
        power,
        settings,
        systemStatus,
        firmware,
        usageTime,
        projectRegister,
      }}
    >
      {props.children}
    </CraftyDeviceContext.Provider>
  );
};

export const useCraftyDeviceContext = () => {
  const context = useContext(CraftyDeviceContext);
  if (!context) {
    throw new Error(
      "useCraftyDeviceContext must be used within a CraftyDeviceProvider"
    );
  }
  return context;
};
