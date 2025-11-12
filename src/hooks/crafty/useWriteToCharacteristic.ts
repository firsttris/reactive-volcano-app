import { bluetoothQueue } from "../../utils/bluetoothQueue";

export const useWriteToCharacteristic = () => {
  const writeValueToCharacteristic = async (
    characteristic: BluetoothRemoteGATTCharacteristic,
    buffer: ArrayBuffer
  ) => {
    return bluetoothQueue.add(() => characteristic.writeValue(buffer));
  };

  return {
    writeValueToCharacteristic,
  };
};
