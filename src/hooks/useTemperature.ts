import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { CharateristicUUIDs } from "../utils/uuids";
import {
  createCharateristicWithEventListenerWithQueue,
  detachEventListenerWithQueue,
} from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useTemperature = () => {
  const [getTargetTemperature, setTargetTemperature] = createSignal(0);
  const [getCurrentTemperature, setCurrentTemperature] = createSignal(0);
  const { getDeviceControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();

  const handleCharacteristics = async () => {
    const service = getDeviceControlService();
    if (!service) return;
    const targetTemperature = await createCharateristicWithEventListenerWithQueue(
      service,
      CharateristicUUIDs.targetTemperature,
      handleTargetTemperature
    );
    if(!targetTemperature) {
      return Promise.reject("targetTemperatureCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      targetTemperature,
    }));
    const currentTemperature = await createCharateristicWithEventListenerWithQueue(
      service,
      CharateristicUUIDs.currentTemperature,
      handleCurrentTemperature
    );
    if(!currentTemperature) {
      return Promise.reject("currentTemperatureCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      currentTemperature,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { targetTemperature, currentTemperature } = getCharacteristics();
    if (targetTemperature) {
      detachEventListenerWithQueue(targetTemperature, handleTargetTemperature);
    }
    if (currentTemperature) {
      detachEventListenerWithQueue(currentTemperature, handleCurrentTemperature);
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
