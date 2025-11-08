import { useBluetooth } from "../../provider/BluetoothProvider";
import { CharateristicUUIDsKeys } from "../../utils/uuids";
import { bluetoothQueue } from "../../utils/bluetoothQueue";

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
    return bluetoothQueue.add(() => characteristic.writeValue(buffer));
  };

  return {
    writeValueToCharacteristic,
  };
};
