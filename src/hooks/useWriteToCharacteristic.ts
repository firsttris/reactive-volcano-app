import { useBluetooth } from "../provider/BluetoothProvider";
import {
  CharateristicUUIDsKeys,
} from "../utils/uuids";
import PQueue from "p-queue";

const queue = new PQueue({concurrency: 1});

export const useWriteToCharacteristic = () => {
  const { getCharacteristics } = useBluetooth();

  const writeValueToCharacteristic = async (
    characteristicsUUID: CharateristicUUIDsKeys,
    bufferValue: number,
    bufferConversionFunction: (value: number) => ArrayBuffer
  ) => {
    const characteristics = getCharacteristics();
    const characteristic = characteristics[characteristicsUUID];
    if (!characteristic) {
      return Promise.reject("Characteristic not found");
    }
    const buffer = bufferConversionFunction(bufferValue);
    return queue.add(() => characteristic.writeValue(buffer));
  };

  return {
    writeValueToCharacteristic
  };
};
