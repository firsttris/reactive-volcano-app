import { useBluetooth } from "../provider/BluetoothProvider";
import {
  convertToUInt16BLE,
  convertToUInt32BLE,
  convertToUInt8BLE,
} from "../utils/bluetoothUtils";
import {
  CharateristicUUIDs,
  CharateristicUUIDsKeys,
  States,
} from "../utils/uuids";
import { createEffect, createSignal } from "solid-js";

export const useWriteToCharacteristic = () => {
  const [isWriting, setIsWriting] = createSignal(false);
  const { getDeviceControlService, getCharacteristics, setCharacteristics } = useBluetooth();

  const handleCharacteristics = async () => {
    const service = getDeviceControlService();
    if (!service) return;

    const heaterOnCharacteristic = await service.getCharacteristic(
      CharateristicUUIDs.heaterOn
    );
    const heaterOffCharacteristic = await service.getCharacteristic(
      CharateristicUUIDs.heaterOff
    );
    const pumpOffCharacteristic = await service.getCharacteristic(
      CharateristicUUIDs.pumpOff
    );
    const pumpOnCharacteristic = await service.getCharacteristic(
      CharateristicUUIDs.pumpOn
    );
    setCharacteristics((prev) => ({
      ...prev,
      pumpOn: pumpOnCharacteristic,
      pumpOff: pumpOffCharacteristic,
      heaterOff: heaterOffCharacteristic,
      heaterOn: heaterOnCharacteristic,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  const writeValueToCharacteristic = async (
    characteristicsUUID: CharateristicUUIDsKeys,
    bufferValue: number,
    bufferConversionFunction: (value: number) => ArrayBuffer
  ) => {
    if (isWriting()) {
      return Promise.reject("Another write operation is in progress");
    }

    setIsWriting(true);

    const characteristics = getCharacteristics();
    const characteristic = characteristics[characteristicsUUID];
    if (!characteristic) {
      setIsWriting(false);
      return Promise.resolve("Characteristic not found");
    }

    const buffer = bufferConversionFunction(bufferValue);
    await characteristic.writeValue(buffer);
    setIsWriting(false);
  };

  const setPumpOn = () =>
    writeValueToCharacteristic("pumpOn", 0, convertToUInt8BLE);
  const setPumpOff = () =>
    writeValueToCharacteristic("pumpOff", 0, convertToUInt8BLE);
  const setHeatOn = () =>
    writeValueToCharacteristic("heaterOn", 0, convertToUInt8BLE);
  const setHeatOff = () =>
    writeValueToCharacteristic("heaterOff", 0, convertToUInt8BLE);
  const setVibrationOn = () =>
    writeValueToCharacteristic(
      "vibration",
      States.VIBRATION,
      convertToUInt32BLE
    );
  const setVibrationOff = () =>
    writeValueToCharacteristic(
      "vibration",
      0x10000 + States.VIBRATION,
      convertToUInt32BLE
    );
  const setDisplayOnCoolingOn = () =>
    writeValueToCharacteristic(
      "display",
      States.DISPLAY_ON_COOLING,
      convertToUInt32BLE
    );
  const setDisplayOnCoolingOff = () =>
    writeValueToCharacteristic(
      "display",
      0x10000 + States.DISPLAY_ON_COOLING,
      convertToUInt32BLE
    );
  const setShutOffTime = (timeInSec: number) =>
    writeValueToCharacteristic("shutoffTime", timeInSec, convertToUInt16BLE);
  const setBrightness = (brightness: number) =>
    writeValueToCharacteristic("brightness", brightness, convertToUInt16BLE);
  const setTemperature = (value: number) =>
    writeValueToCharacteristic(
      "targetTemperature",
      value * 10,
      convertToUInt32BLE
    );

  return {
    setPumpOn,
    setPumpOff,
    setHeatOn,
    setHeatOff,
    setVibrationOn,
    setVibrationOff,
    setDisplayOnCoolingOn,
    setDisplayOnCoolingOff,
    setShutOffTime,
    setBrightness,
    setTemperature,
  };
};
