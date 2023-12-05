import { createContext, useContext } from "solid-js";
import type { JSX } from "solid-js";
import { useTemperature } from "../hooks/useTemperature";
import { useWriteToCharacteristic } from "../hooks/useWriteToCharacteristic";
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
    setTemperature: (temperature: number) => void;
    setPumpOn: () => void;
    setPumpOff: () => void;
    setHeatOn: () => void;
    setHeatOff: () => void;
    setVibrationOn: () => void;
    setVibrationOff: () => void;
    setDisplayOnCoolingOn: () => void;
    setDisplayOnCoolingOff: () => void;
    setShutOffTime: (timeInSec: number) => void;
    setBrightness: (brightness: number) => void;
  };
};

const CharacteristicsContext = createContext<CharacteristicMethods>();

type CharacteristicsProviderProps = {
  children: JSX.Element;
};

export const CharacteristicsProvider = (
  props: CharacteristicsProviderProps
) => {
  const { getCurrentTemperature, getTargetTemperature } = useTemperature();
  const {
    setTemperature,
    setPumpOn,
    setPumpOff,
    setHeatOn,
    setHeatOff,
    setVibrationOn,
    setVibrationOff,
    setDisplayOnCoolingOn,
    setDisplayOnCoolingOff,
    setShutOffTime,
    setBrightness,
  } = useWriteToCharacteristic();

  const { getSerialNumber, getFirmwareVersion, getBleFirmwareVersion } =
    useDeviceInformation();
  const { getHoursOfHeating, getMinutesOfHeating } = useHeatingTime();
  const { isCelsius, isDisplayOnCooling } = useDeviceSetting();
  const { isAutoShutdownActive, isHeatingActive, isPumpActive } =
    useDeviceStatus();
  const { getAutoOffTimeInSec, getShutoffTimeInSec } = useShutdowntime();
  const { getBrightness } = useBrightness();
  const { isVibrationOn } = useVibration();

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
          setTemperature,
          setPumpOn,
          setPumpOff,
          setHeatOn,
          setHeatOff,
          setVibrationOn,
          setVibrationOff,
          setDisplayOnCoolingOn,
          setDisplayOnCoolingOff,
          setShutOffTime,
          setBrightness,
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
