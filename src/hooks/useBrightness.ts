import { createEffect, createSignal } from "solid-js";
import { convertBLEToUint16, convertToUInt16BLE } from "../utils/bluetoothUtils";
import { createCharateristic } from "../utils/characteristic";
import { CharateristicUUIDs } from "../utils/uuids";
import { useBluetooth } from "../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "./useWriteToCharacteristic";

export const useBrightness = (
) => {
  const [getBrightness, setBrightness] = createSignal(0);
  const { getDeviceControlService, setCharacteristics } = useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

  const handleCharacteristics = async () => {
    const controlService = getDeviceControlService();
    if (!controlService) return;
    const brightness = await createCharateristic(
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

  const setTargetBrightness = async (brightness: number) =>
  {
    setBrightness(brightness)
    await writeValueToCharacteristic("brightness", brightness, convertToUInt16BLE);
  }

  return {
    getBrightness,
    setTargetBrightness
  };
};
