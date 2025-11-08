import { createEffect, createSignal, onCleanup } from "solid-js";
import {
  convertBLEToUint16,
  convertToUInt32BLE,
} from "../../utils/bluetoothUtils";
import { CharateristicUUIDs, States } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "./useWriteToCharacteristic";

export const useDeviceSetting = () => {
  const [isCelsius, setIsCelsius] = createSignal<boolean>(true);
  const [isDisplayOnCooling, setIsDisplayOnCooling] =
    createSignal<boolean>(true);
  const { getDeviceStateService, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

  const handleCharacteristics = async () => {
    const stateService = getDeviceStateService();
    if (!stateService) return;
    const display = await createCharateristicWithEventListener(
      stateService,
      CharateristicUUIDs.display,
      handleDisplayValue
    );
    if (!display) {
      return Promise.reject("displayCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      display,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { display } = getCharacteristics();
    if (display) {
      detachEventListener(display, handleDisplayValue);
    }
  });

  const setDisplayOnCoolingOn = async () => {
    await writeValueToCharacteristic(
      "display",
      States.DISPLAY_ON_COOLING,
      convertToUInt32BLE
    );
    setIsDisplayOnCooling(true);
  };
  const setDisplayOnCoolingOff = async () =>
    await writeValueToCharacteristic(
      "display",
      0x10000 + States.DISPLAY_ON_COOLING,
      convertToUInt32BLE
    );

  const handleDisplayValue = (value: DataView) => {
    const convertedValue = convertBLEToUint16(value);
    const isCelsius = (convertedValue & States.FAHRENHEIT_ENA) === 0;
    setIsCelsius(isCelsius);
    const isDisplayOn = (convertedValue & States.DISPLAY_ON_COOLING) === 0;
    setIsDisplayOnCooling(isDisplayOn);
  };

  return {
    isCelsius,
    isDisplayOnCooling,
    setDisplayOnCoolingOn,
    setDisplayOnCoolingOff,
  };
};
