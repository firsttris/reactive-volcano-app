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
import { useWriteToCharacteristic } from "../volcano/useWriteToCharacteristic";

export const useTemperature = () => {
  const [getTargetTemperature, setTargetTemperature] = createSignal(0);
  const [getCurrentTemperature, setCurrentTemperature] = createSignal(0);
  const [getBoostTemperature, setBoostTemperature] = createSignal(0);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

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

  const handleBoostTemperature = (value: DataView) => {
    const convertedValue = convertBLEToUint16(value);
    const boostTemperature = Math.round(convertedValue / 10.0);
    setBoostTemperature(boostTemperature);
  };

  const handleCharacteristics = async () => {
    const service = getCraftyControlService();
    if (!service) return;

    const targetTemperature = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.writeTemp,
      handleTargetTemperature
    );
    if (!targetTemperature) {
      return Promise.reject("writeTempCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      writeTemp: targetTemperature,
    }));

    const currentTemperature = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.currTemperatureChanged,
      handleCurrentTemperature
    );
    if (!currentTemperature) {
      return Promise.reject("currTemperatureChangedCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      currTemperatureChanged: currentTemperature,
    }));

    const boostTemperature = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.writeBoostTemp,
      handleBoostTemperature
    );
    if (!boostTemperature) {
      return Promise.reject("writeBoostTempCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      writeBoostTemp: boostTemperature,
    }));
  };

  const setTemperature = async (value: number) => {
    await writeValueToCharacteristic(
      "writeTemp",
      value * 10,
      convertToUInt16BLE
    );
  };

  const setBoostTemp = async (value: number) => {
    await writeValueToCharacteristic(
      "writeBoostTemp",
      value * 10,
      convertToUInt16BLE
    );
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { writeTemp, currTemperatureChanged, writeBoostTemp } =
      getCharacteristics();
    if (writeTemp) {
      detachEventListener(writeTemp, handleTargetTemperature);
    }
    if (currTemperatureChanged) {
      detachEventListener(currTemperatureChanged, handleCurrentTemperature);
    }
    if (writeBoostTemp) {
      detachEventListener(writeBoostTemp, handleBoostTemperature);
    }
  });

  return {
    getTargetTemperature,
    getCurrentTemperature,
    getBoostTemperature,
    setTemperature,
    setBoostTemp,
    handleCharacteristics,
  };
};
