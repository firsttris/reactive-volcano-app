import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { CharateristicUUIDs } from "../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useTemperature = () => {
  const [getTargetTemperature, setTargetTemperature] = createSignal(0);
  const [getCurrentTemperature, setCurrentTemperature] = createSignal(0);
  const { getService4, getCharacteristics, setCharacteristics } =
    useBluetooth();

  const handleCharacteristics = async () => {
    const service = getService4();
    if (!service) return;
    const targetTemperature = await createCharateristicWithEventListener(
      service,
      CharateristicUUIDs.targetTemperature,
      handleTargetTemperature
    );
    const currentTemperature = await createCharateristicWithEventListener(
      service,
      CharateristicUUIDs.currentTemperature,
      handleCurrentTemperature
    );
    setCharacteristics((prev) => ({
      ...prev,
      targetTemperature,
      currentTemperature,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { targetTemperature, currentTemperature } = getCharacteristics();
    if (targetTemperature) {
      detachEventListener(targetTemperature, handleTargetTemperature);
    }
    if (currentTemperature) {
      detachEventListener(currentTemperature, handleCurrentTemperature);
    }
  });

  const handleTargetTemperature = (value: DataView) => {
    const convertedValue = convertBLEToUint16(value);
    const targetTemperature = Math.round(convertedValue / 10.0);
    setTargetTemperature(targetTemperature);
  };

  const handleCurrentTemperature = (value: DataView) => {
    const convertedValue = convertBLEToUint16(value);
    const currentTemperature = Math.round(convertedValue / 10.0);
    setCurrentTemperature(currentTemperature);
  };

  return {
    getTargetTemperature,
    getCurrentTemperature,
  };
};
