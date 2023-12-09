import { createEffect, createSignal } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { createCharateristicWithQueue } from "../utils/characteristic";
import { CharateristicUUIDs } from "../utils/uuids";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useBrightness = (
) => {
  const [getBrightness, setBrightness] = createSignal(0);
  const { getDeviceControlService, setCharacteristics } = useBluetooth();

  const handleCharacteristics = async () => {
    const controlService = getDeviceControlService();
    if (!controlService) return;
    const brightness = await createCharateristicWithQueue(
      controlService,
      CharateristicUUIDs.brightness,
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
