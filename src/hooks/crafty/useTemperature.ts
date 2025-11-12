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

export const useTemperature = () => {
  const [getTargetTemperature, setTargetTemperature] = createSignal(0);
  const [getCurrentTemperature, setCurrentTemperature] = createSignal(0);
  const [getBoostTemperature, setBoostTemperature] = createSignal(0);
  const { getCraftyService1, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

  const handleCharacteristics = async () => {
    const service = getCraftyService1();
    if (!service) return;

    // Target Temperature
    const targetTemperature = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.targetTemperature,
      handleTargetTemperature
    );
    if (!targetTemperature) {
      return Promise.reject("targetTemperatureCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      targetTemperature,
    }));

    // Current Temperature
    const currentTemperature = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.currentTemperature,
      handleCurrentTemperature
    );
    if (!currentTemperature) {
      return Promise.reject("currentTemperatureCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      currentTemperature,
    }));

    // Boost Temperature
    const boostTemperature = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.boostTemperature,
      handleBoostTemperature
    );
    if (!boostTemperature) {
      return Promise.reject("boostTemperatureCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      boostTemperature,
    }));
  };

  const handleTargetTemperature = (value: DataView) => {
    const temp = Math.round(convertBLEToUint16(value) / 10);
    setTargetTemperature(temp);
  };

  const handleCurrentTemperature = (value: DataView) => {
    const temp = Math.round(convertBLEToUint16(value) / 10);
    setCurrentTemperature(temp);
  };

  const handleBoostTemperature = (value: DataView) => {
    const temp = Math.round(convertBLEToUint16(value) / 10);
    setBoostTemperature(temp);
  };

  const setTemperature = async (value: number) => {
    const characteristic = getCharacteristics().targetTemperature;
    if (characteristic) {
      const buffer = convertToUInt16BLE(value * 10);
      await writeValueToCharacteristic(characteristic, buffer);
    }
  };

  const setBoostTemperatureValue = async (value: number) => {
    const characteristic = getCharacteristics().boostTemperature;
    if (characteristic) {
      const buffer = convertToUInt16BLE(value * 10);
      await writeValueToCharacteristic(characteristic, buffer);
    }
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const characteristics = getCharacteristics();
    if (characteristics.targetTemperature) {
      detachEventListener(
        characteristics.targetTemperature,
        handleTargetTemperature
      );
    }
    if (characteristics.currentTemperature) {
      detachEventListener(
        characteristics.currentTemperature,
        handleCurrentTemperature
      );
    }
    if (characteristics.boostTemperature) {
      detachEventListener(
        characteristics.boostTemperature,
        handleBoostTemperature
      );
    }
  });

  return {
    getTargetTemperature,
    getCurrentTemperature,
    getBoostTemperature,
    setTemperature,
    setBoostTemperature: setBoostTemperatureValue,
  };
};
