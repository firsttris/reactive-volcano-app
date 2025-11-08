import { bluetoothQueue } from "./bluetoothQueue";

export const attachEventListener = async (
  characteristic: BluetoothRemoteGATTCharacteristic,
  handleValue: (value: DataView) => void
) => {
  const characteristicNotification = await characteristic.startNotifications();
  characteristicNotification.addEventListener(
    "characteristicvaluechanged",
    (event) => eventHandler(event, handleValue)
  );
  return characteristicNotification;
};

export const detachEventListener = async (
  characteristicNotification: BluetoothRemoteGATTCharacteristic,
  handleValue: (value: DataView) => void
) => {
  characteristicNotification.removeEventListener(
    "characteristicvaluechanged",
    (event) => eventHandler(event, handleValue)
  );
  await characteristicNotification.stopNotifications();
};

export const handleInitialValue = async (
  characteristic: BluetoothRemoteGATTCharacteristic,
  handleValue: (value: DataView) => void
) => {
  const value = await characteristic.readValue();
  handleValue(value);
};

export const getCharacteristic = async (
  service: BluetoothRemoteGATTService,
  characteristicUUID: string
) =>
  bluetoothQueue.add(async () => {
    if (!service.device.gatt?.connected) {
      return null;
    }
    return await service.getCharacteristic(characteristicUUID);
  });

export const createCharateristicWithEventListener = async (
  service: BluetoothRemoteGATTService,
  characteristicUUID: string,
  handleValue: (value: DataView) => void
) => {
  const characteristic = await getCharacteristic(service, characteristicUUID);
  if (!characteristic) {
    return;
  }
  await handleInitialValue(characteristic, handleValue);
  return attachEventListener(characteristic, handleValue);
};

export const createCharateristic = async (
  service: BluetoothRemoteGATTService,
  characteristicUUID: string,
  handleValue: (value: DataView) => void
) => {
  const characteristic = await getCharacteristic(service, characteristicUUID);
  if (!characteristic) {
    return;
  }
  await handleInitialValue(characteristic, handleValue);
  return characteristic;
};

const eventHandler = (event: Event, handleValue: (value: DataView) => void) => {
  const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
  if (!value) {
    return;
  }
  handleValue(value);
};
