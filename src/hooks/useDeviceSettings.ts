import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { CharateristicUUIDs, States } from "../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useDeviceSetting = (
) => {
  const [isCelsius, setIsCelsius] = createSignal<boolean>(true);
  const [isDisplayOnCooling, setIsDisplayOnCooling] =
    createSignal<boolean>(true);
  const { getService3, getCharacteristics, setCharacteristics } = useBluetooth();

  const handleCharacteristics = async () => {
    const service = getService3();
    if (!service) return;
    const display = await createCharateristicWithEventListener(
      service,
      CharateristicUUIDs.display,
      handleDisplayValue
    );
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
