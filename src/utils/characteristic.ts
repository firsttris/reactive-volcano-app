import { CharateristicUUIDs } from "./uuids";
import PQueue from 'p-queue';

const queue = new PQueue({concurrency: 1});

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

export const getCharacteristic = async (service: BluetoothRemoteGATTService,
  characteristicUUID: CharateristicUUIDs) => 
  queue.add(async () => await service.getCharacteristic(characteristicUUID))

export const createCharateristicWithEventListener = async (
  service: BluetoothRemoteGATTService,
  characteristicUUID: CharateristicUUIDs,
  handleValue: (value: DataView) => void
) => {
  const characteristic = await getCharacteristic(service, characteristicUUID);
  if(!characteristic) {
    return;
  }
  await handleInitialValue(characteristic, handleValue);
  return attachEventListener(characteristic, handleValue);
};

export const createCharateristic = async (
  service: BluetoothRemoteGATTService,
  characteristicUUID: CharateristicUUIDs,
  handleValue: (value: DataView) => void
) => {
  const characteristic = await getCharacteristic(service, characteristicUUID);
  if(!characteristic) {
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
