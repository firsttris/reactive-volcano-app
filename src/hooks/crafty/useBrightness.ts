import { createEffect, createSignal, onCleanup } from "solid-js";
import {
  convertBLEToUint16,
  convertToUInt16BLE,
} from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "./useWriteToCharacteristic";

export const useBrightness = () => {
  const [getBrightness, setBrightness] = createSignal(0);
  const { getCraftyService1, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

  const handleBrightness = (value: DataView) => {
    const brightness = convertBLEToUint16(value);
    setBrightness(brightness);
  };

  const handleCharacteristics = async () => {
    const service = getCraftyService1();
    if (!service) return;

    const brightness = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.brightness,
      handleBrightness
    );
    if (!brightness) {
      return Promise.reject("brightnessCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      brightness,
    }));
  };

  const setBrightnessValue = async (value: number) => {
    const characteristic = getCharacteristics().brightness;
    if (characteristic) {
      const buffer = convertToUInt16BLE(value);
      await writeValueToCharacteristic(characteristic, buffer);
    }
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const characteristics = getCharacteristics();
    if (characteristics.brightness) {
      detachEventListener(characteristics.brightness, handleBrightness);
    }
  });

  return {
    getBrightness,
    setBrightness: setBrightnessValue,
  };
};
