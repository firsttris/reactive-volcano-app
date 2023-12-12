import { createContext, useContext } from "solid-js";
import type { JSX } from "solid-js";
import { useTemperature } from "../hooks/useTemperature";
import { useDeviceInformation } from "../hooks/useDeviceInformation";
import { useHeatingTime } from "../hooks/useHeatingTime";
import { useDeviceSetting } from "../hooks/useDeviceSettings";
import { useDeviceStatus } from "../hooks/useDeviceStatus";
import { useShutdowntime } from "../hooks/useShutdowntime";
import { useBrightness } from "../hooks/useBrightness";
import { useVibration } from "../hooks/useVibration";

type CharacteristicMethods = {
  getters: {
    getCurrentTemperature: () => number;
    getTargetTemperature: () => number;
    getSerialNumber: () => string;
    getFirmwareVersion: () => string;
    getBleFirmwareVersion: () => string;
    getHoursOfHeating: () => number;
    getMinutesOfHeating: () => number;
    isCelsius: () => boolean;
    isDisplayOnCooling: () => boolean;
    isAutoShutdownActive: () => boolean;
    isHeatingActive: () => boolean;
    isPumpActive: () => boolean;
    isVibrationOn: () => boolean;
    getAutoOffTimeInSec: () => number;
    getShutoffTimeInSec: () => number;
    getBrightness: () => number;
  };
  setters: {
    setTargetTemperature: (temperature: number) => void;
    setPumpOn: () => Promise<void>;
    setPumpOff: () => Promise<void>;
    setHeatOn: () => Promise<void>;
    setHeatOff: () => Promise<void>;
    setVibrationOn: () => Promise<void>;
    setVibrationOff: () => Promise<void>;
    setDisplayOnCoolingOn: () => Promise<void>;
    setDisplayOnCoolingOff: () => Promise<void>;
    setShutOffTime: (timeInSec: number) => Promise<void>;
    setTargetBrightness: (brightness: number) => Promise<void>;
  };
};

const CharacteristicsContext = createContext<CharacteristicMethods>();

type CharacteristicsProviderProps = {
  children: JSX.Element;
};

export const CharacteristicsProvider = (
  props: CharacteristicsProviderProps
) => {
  const { getCurrentTemperature, getTargetTemperature, setTargetTemperature } = useTemperature();

  const { getSerialNumber, getFirmwareVersion, getBleFirmwareVersion } =
    useDeviceInformation();
  const { getHoursOfHeating, getMinutesOfHeating } = useHeatingTime();
  const { isCelsius, isDisplayOnCooling, setDisplayOnCoolingOff, setDisplayOnCoolingOn } = useDeviceSetting();
  const { isAutoShutdownActive, isHeatingActive, isPumpActive, setHeatOff, setHeatOn, setPumpOff, setPumpOn } =
    useDeviceStatus();
  const { getAutoOffTimeInSec, getShutoffTimeInSec, setShutOffTime } = useShutdowntime();
  const { getBrightness, setTargetBrightness } = useBrightness();
  const { isVibrationOn, setVibrationOff, setVibrationOn } = useVibration();

  return (
    <CharacteristicsContext.Provider
      value={{
        getters: {
          getCurrentTemperature,
          getTargetTemperature,
          getSerialNumber,
          getFirmwareVersion,
          getBleFirmwareVersion,
          getHoursOfHeating,
          getMinutesOfHeating,
          isCelsius,
          isDisplayOnCooling,
          isAutoShutdownActive,
          isHeatingActive,
          isPumpActive,
          isVibrationOn,
          getAutoOffTimeInSec,
          getShutoffTimeInSec,
          getBrightness,
        },
        setters: {
          setTargetTemperature,
          setPumpOn,
          setPumpOff,
          setHeatOn,
          setHeatOff,
          setVibrationOn,
          setVibrationOff,
          setDisplayOnCoolingOn,
          setDisplayOnCoolingOff,
          setShutOffTime,
          setTargetBrightness,
        },
      }}
    >
      {props.children}
    </CharacteristicsContext.Provider>
  );
};

export const useCharacteristics = () => {
  const context = useContext(CharacteristicsContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
