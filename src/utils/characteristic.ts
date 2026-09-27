import { bluetoothQueue } from "./bluetoothQueue";

type ValueHandler = (value: DataView) => void;
type EventWrapper = (event: Event) => void;

// Keeps the actual event listener per characteristic + handler so it can be
// removed again (removeEventListener needs the identical function reference).
const registeredListeners = new WeakMap<
  BluetoothRemoteGATTCharacteristic,
  Map<ValueHandler, EventWrapper>
>();

export const attachEventListener = async (
  characteristic: BluetoothRemoteGATTCharacteristic,
  handleValue: ValueHandler
) => {
  const characteristicNotification = await bluetoothQueue.add(() =>
    characteristic.startNotifications()
  );
  if (!characteristicNotification) {
    return characteristic;
  }
  const wrapper: EventWrapper = (event) => eventHandler(event, handleValue);
  let listeners = registeredListeners.get(characteristicNotification);
  if (!listeners) {
    listeners = new Map();
    registeredListeners.set(characteristicNotification, listeners);
  }
  const previous = listeners.get(handleValue);
  if (previous) {
    characteristicNotification.removeEventListener(
      "characteristicvaluechanged",
      previous
    );
  }
  listeners.set(handleValue, wrapper);
  characteristicNotification.addEventListener(
    "characteristicvaluechanged",
    wrapper
  );
  return characteristicNotification;
};

export const detachEventListener = async (
  characteristicNotification: BluetoothRemoteGATTCharacteristic,
  handleValue: ValueHandler
) => {
  const listeners = registeredListeners.get(characteristicNotification);
  const wrapper = listeners?.get(handleValue);
  if (wrapper) {
    characteristicNotification.removeEventListener(
      "characteristicvaluechanged",
      wrapper
    );
    listeners?.delete(handleValue);
  }
  if (characteristicNotification.service?.device?.gatt?.connected === false) {
    return;
  }
  try {
    await bluetoothQueue.add(() =>
      characteristicNotification.stopNotifications()
    );
  } catch (error) {
    console.warn("stopNotifications failed:", error);
  }
};

export const readValue = (characteristic: BluetoothRemoteGATTCharacteristic) =>
  bluetoothQueue.add(() => characteristic.readValue());

export const handleInitialValue = async (
  characteristic: BluetoothRemoteGATTCharacteristic,
  handleValue: ValueHandler
) => {
  const value = await readValue(characteristic);
  if (value) {
    handleValue(value);
  }
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
  handleValue: ValueHandler
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
  handleValue: ValueHandler
) => {
  const characteristic = await getCharacteristic(service, characteristicUUID);
  if (!characteristic) {
    return;
  }
  await handleInitialValue(characteristic, handleValue);
  return characteristic;
};

const eventHandler = (event: Event, handleValue: ValueHandler) => {
  const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
  if (!value) {
    return;
  }
  handleValue(value);
};
