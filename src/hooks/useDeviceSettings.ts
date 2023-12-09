import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { CharateristicUUIDs, States } from "../utils/uuids";
import {
  createCharateristicWithEventListenerWithQueue,
  detachEventListenerWithQueue,
} from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useDeviceSetting = (
) => {
  const [isCelsius, setIsCelsius] = createSignal<boolean>(true);
  const [isDisplayOnCooling, setIsDisplayOnCooling] =
    createSignal<boolean>(true);
  const { getDeviceStateService, getCharacteristics, setCharacteristics } = useBluetooth();

  const handleCharacteristics = async () => {
    const stateService = getDeviceStateService();
    if (!stateService) return;
    const display = await createCharateristicWithEventListenerWithQueue(
      stateService,
      CharateristicUUIDs.display,
      handleDisplayValue
    );
    if(!display) {
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
      detachEventListenerWithQueue(display, handleDisplayValue);
    }
  });

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
  };
};
