import { createEffect, createSignal } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { createCharateristic } from "../utils/characteristic";
import { CharateristicUUIDs } from "../utils/uuids";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useBrightness = (
) => {
  const [getBrightness, setBrightness] = createSignal(0);
  const { getService4, setCharacteristics } = useBluetooth();

  const handleCharacteristics = async () => {
    const vulcanoSerivce4 = getService4();
    if (!vulcanoSerivce4) return;
    const brightness = await createCharateristic(
      vulcanoSerivce4,
      CharateristicUUIDs.brightness,
      handleBrightness
    );
    setCharacteristics((prev) => ({
      ...prev,
      brightness,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  const handleBrightness = (value: DataView): void => {
    const convertedValue = convertBLEToUint16(value);
    const brightness = convertedValue;
    setBrightness(brightness);
  };

  return {
    getBrightness,
  };
};
