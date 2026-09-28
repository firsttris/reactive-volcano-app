import type PQueue from "p-queue";

/**
 * Shared building block for devices that expose every value as its own GATT
 * characteristic (Crafty, Volcano): reads values, forwards notifications and
 * serializes all writes through the Bluetooth queue.
 */

export type Reader<Values> = (value: DataView) => Partial<Values>;
export type UpdateListener<Values> = (update: Partial<Values>) => void;

export interface CharacteristicDevice<Key extends string, Values> {
  subscribe(listener: UpdateListener<Values>): () => void;
  /** Reads all readable values, then enables the notifications */
  start(): Promise<void>;
  read(key: Key): Promise<void>;
  write(key: Key, value: ArrayBuffer): Promise<void>;
  /** Performs several writes as one queue entry, so nothing gets in between */
  writeSequence(writes: [Key, ArrayBuffer][]): Promise<void>;
  dispose(): Promise<void>;
}

export const createCharacteristicDevice = <Key extends string, Values>(
  options: {
    characteristics: Partial<Record<Key, BluetoothRemoteGATTCharacteristic>>;
    readers: Partial<Record<Key, Reader<Values>>>;
    notifying: Key[];
    name: string;
  },
  queue: PQueue
): CharacteristicDevice<Key, Values> => {
  const { characteristics, readers, notifying, name } = options;
  const listeners = new Set<UpdateListener<Values>>();
  const notificationHandlers = new Map<
    BluetoothRemoteGATTCharacteristic,
    (event: Event) => void
  >();
  let disposed = false;

  const emit = (update: Partial<Values>) => {
    for (const listener of listeners) listener(update);
  };

  const require = (key: Key) => {
    const characteristic = characteristics[key];
    if (!characteristic) {
      throw new Error(`${name} characteristic "${key}" is not available`);
    }
    return characteristic;
  };

  const read = async (key: Key) => {
    const characteristic = characteristics[key];
    const reader = readers[key];
    if (!characteristic || !reader || disposed) return;
    const value = await queue.add(() => characteristic.readValue());
    if (value && !disposed) emit(reader(value));
  };

  const start = async () => {
    for (const key of Object.keys(readers) as Key[]) {
      await read(key);
    }
    for (const key of notifying) {
      const characteristic = characteristics[key];
      const reader = readers[key];
      if (!characteristic || !reader || disposed) continue;
      if (notificationHandlers.has(characteristic)) continue;
      const handler = (event: Event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic | null)
          ?.value;
        if (value) emit(reader(value));
      };
      await queue.add(() => characteristic.startNotifications());
      characteristic.addEventListener("characteristicvaluechanged", handler);
      notificationHandlers.set(characteristic, handler);
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start,
    read,
    async write(key, value) {
      const characteristic = require(key);
      if (disposed) return;
      await queue.add(() => characteristic.writeValue(value));
    },
    async writeSequence(writes) {
      const resolved = writes.map(
        ([key, value]) => [require(key), value] as const
      );
      if (disposed) return;
      await queue.add(async () => {
        for (const [characteristic, value] of resolved) {
          await characteristic.writeValue(value);
        }
      });
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      for (const [characteristic, handler] of notificationHandlers) {
        characteristic.removeEventListener(
          "characteristicvaluechanged",
          handler
        );
        try {
          await characteristic.stopNotifications();
        } catch {
          // Fails when the device is already disconnected
        }
      }
      notificationHandlers.clear();
    },
  };
};

/** Gets a primary service through the queue */
export const getService = async (
  server: BluetoothRemoteGATTServer,
  uuid: string,
  queue: PQueue
) => {
  const service = await queue.add(() => server.getPrimaryService(uuid));
  if (!service) throw new Error(`Service ${uuid} not found`);
  return service;
};

/** Gets a characteristic through the queue; throws if it is missing */
export const getRequiredCharacteristic = async (
  service: BluetoothRemoteGATTService,
  uuid: string,
  queue: PQueue
) => {
  const characteristic = await queue.add(() => service.getCharacteristic(uuid));
  if (!characteristic) throw new Error(`Characteristic ${uuid} not found`);
  return characteristic;
};

/** Gets a characteristic through the queue; undefined if it is missing */
export const getOptionalCharacteristic = async (
  service: BluetoothRemoteGATTService,
  uuid: string,
  queue: PQueue
) => {
  try {
    return await getRequiredCharacteristic(service, uuid, queue);
  } catch (error) {
    console.warn(`Characteristic ${uuid} not available`, error);
    return undefined;
  }
};
