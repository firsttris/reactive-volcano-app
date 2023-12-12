import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16, convertToUInt32BLE } from "../utils/bluetoothUtils";
import { CharateristicUUIDs } from "../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "./useWriteToCharacteristic";

export const useTemperature = () => {
  const [getTargetTemperature, setTargetTemperature] = createSignal(0);
  const [getCurrentTemperature, setCurrentTemperature] = createSignal(0);
  const { getDeviceControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();
    const { writeValueToCharacteristic } = useWriteToCharacteristic();

  const handleCharacteristics = async () => {
    const service = getDeviceControlService();
    if (!service) return;
    const targetTemperature = await createCharateristicWithEventListener(
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
    const currentTemperature = await createCharateristicWithEventListener(
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

  const setTemperature = async (value: number) => {
    await writeValueToCharacteristic(
      "targetTemperature",
      value * 10,
      convertToUInt32BLE
    );
    setTargetTemperature(value);
  }

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
    setTargetTemperature: setTemperature
  };
};
