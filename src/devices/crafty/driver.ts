import type PQueue from "p-queue";
import {
  CraftyCharacteristicUUIDs as UUID,
  CraftyServiceUUIDs,
} from "../../utils/uuids";
import {
  SecurityCode,
  encodeBoostTemperature,
  encodeFactoryReset,
  encodeHeaterCommand,
  encodeTargetTemperature,
  encodeUint16,
  isOldFirmware,
  parseBleFirmwareVersion,
  parseTargetTemperature,
  parseTemperature,
  parseText,
  parseUint16,
} from "./protocol";

export interface CraftyValues {
  targetTemp: number;
  currentTemp: number;
  boostTemp: number;
  batteryLevel: number;
  ledBrightness: number;
  useHours: number;
  projectRegister: number;
  statusRegister2: number;
  // Only available on Crafty+ (firmware >= 2.51)
  bleFirmwareVersion: string | null;
  useMinutes: number | null;
  autoOffCountdown: number | null;
  autoOffRemaining: number | null;
  systemStatus: number | null;
  akkuStatus: number | null;
  akkuStatus2: number | null;
}

export type CraftyUpdate = Partial<CraftyValues>;
export type CraftyUpdateListener = (update: CraftyUpdate) => void;

type Characteristic = BluetoothRemoteGATTCharacteristic;

interface Characteristics {
  targetTemp: Characteristic;
  currentTemp: Characteristic;
  boostTemp: Characteristic;
  battery: Characteristic;
  ledBrightness: Characteristic;
  useHours: Characteristic;
  projectRegister: Characteristic;
  statusRegister2: Characteristic;
  bleFirmwareVersion?: Characteristic;
  useMinutes?: Characteristic;
  autoOffCountdown?: Characteristic;
  autoOffRemaining?: Characteristic;
  heaterOn?: Characteristic;
  heaterOff?: Characteristic;
  securityCode?: Characteristic;
  systemStatus?: Characteristic;
  akkuStatus?: Characteristic;
  akkuStatus2?: Characteristic;
  factoryReset?: Characteristic;
}

type Reader = (value: DataView) => CraftyUpdate;

// How each readable characteristic maps onto CraftyValues
const readers: Partial<Record<keyof Characteristics, Reader>> = {
  targetTemp: (v) => ({ targetTemp: parseTargetTemperature(v) }),
  currentTemp: (v) => ({ currentTemp: parseTemperature(v) }),
  boostTemp: (v) => ({ boostTemp: parseTemperature(v) }),
  battery: (v) => ({ batteryLevel: parseUint16(v) }),
  ledBrightness: (v) => ({ ledBrightness: parseUint16(v) }),
  useHours: (v) => ({ useHours: parseUint16(v) }),
  projectRegister: (v) => ({ projectRegister: parseUint16(v) }),
  statusRegister2: (v) => ({ statusRegister2: parseUint16(v) }),
  bleFirmwareVersion: (v) => ({
    bleFirmwareVersion: parseBleFirmwareVersion(v),
  }),
  useMinutes: (v) => ({ useMinutes: parseUint16(v) }),
  autoOffCountdown: (v) => ({ autoOffCountdown: parseUint16(v) }),
  autoOffRemaining: (v) => ({ autoOffRemaining: parseUint16(v) }),
  systemStatus: (v) => ({ systemStatus: parseUint16(v) }),
  akkuStatus: (v) => ({ akkuStatus: parseUint16(v) }),
  akkuStatus2: (v) => ({ akkuStatus2: parseUint16(v) }),
};

// Characteristics the device pushes changes for (like the legacy app)
const NOTIFYING: (keyof Characteristics)[] = [
  "currentTemp",
  "battery",
  "statusRegister2",
  "projectRegister",
  "autoOffRemaining",
];

// Values that may change after a factory reset
const RESET_AFFECTED: (keyof Characteristics)[] = [
  "targetTemp",
  "boostTemp",
  "ledBrightness",
  "autoOffCountdown",
  "statusRegister2",
];

const FACTORY_RESET_SETTLE_MS = 1000;

export interface CraftyDriver {
  readonly firmwareVersion: string;
  readonly isOldFirmware: boolean;
  subscribe(listener: CraftyUpdateListener): () => void;
  /** Reads all values and enables notifications */
  start(): Promise<void>;
  setTargetTemperature(celsius: number): Promise<void>;
  setBoostTemperature(celsius: number): Promise<void>;
  setLedBrightness(value: number): Promise<void>;
  setAutoOffCountdown(seconds: number): Promise<void>;
  heaterOn(): Promise<void>;
  heaterOff(): Promise<void>;
  factoryReset(): Promise<void>;
  dispose(): Promise<void>;
}

export const createCraftyDriver = (
  characteristics: Characteristics,
  firmwareVersion: string,
  queue: PQueue
): CraftyDriver => {
  const isOld = isOldFirmware(firmwareVersion);
  const listeners = new Set<CraftyUpdateListener>();
  const notificationHandlers = new Map<Characteristic, (e: Event) => void>();
  let disposed = false;

  const emit = (update: CraftyUpdate) => {
    listeners.forEach((listener) => listener(update));
  };

  const read = async (key: keyof Characteristics) => {
    const characteristic = characteristics[key];
    const reader = readers[key];
    if (!characteristic || !reader || disposed) return;
    const value = await queue.add(() => characteristic.readValue());
    if (value && !disposed) emit(reader(value));
  };

  const write = async (key: keyof Characteristics, value: ArrayBuffer) => {
    const characteristic = characteristics[key];
    if (!characteristic) {
      throw new Error(`Crafty characteristic "${key}" is not available`);
    }
    if (disposed) return;
    await queue.add(() => characteristic.writeValue(value));
  };

  /** Writes the security code and the value as one queue entry */
  const writeProtected = async (
    key: keyof Characteristics,
    code: number,
    value: ArrayBuffer
  ) => {
    const { securityCode } = characteristics;
    const characteristic = characteristics[key];
    if (!securityCode || !characteristic) {
      throw new Error(`Crafty characteristic "${key}" is not available`);
    }
    if (disposed) return;
    await queue.add(async () => {
      await securityCode.writeValue(encodeUint16(code));
      await characteristic.writeValue(value);
    });
  };

  const start = async () => {
    for (const key of Object.keys(readers) as (keyof Characteristics)[]) {
      await read(key);
    }
    for (const key of NOTIFYING) {
      const characteristic = characteristics[key];
      const reader = readers[key];
      if (!characteristic || !reader || disposed) continue;
      if (notificationHandlers.has(characteristic)) continue;
      // Old firmware does not support notifications on the project register
      if (isOld && key === "projectRegister") continue;
      const handler = (event: Event) => {
        const value = (event.target as Characteristic | null)?.value;
        if (value) emit(reader(value));
      };
      await queue.add(() => characteristic.startNotifications());
      characteristic.addEventListener("characteristicvaluechanged", handler);
      notificationHandlers.set(characteristic, handler);
    }
  };

  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    listeners.clear();
    for (const [characteristic, handler] of notificationHandlers) {
      characteristic.removeEventListener("characteristicvaluechanged", handler);
      try {
        await characteristic.stopNotifications();
      } catch {
        // Fails when the device is already disconnected
      }
    }
    notificationHandlers.clear();
  };

  return {
    firmwareVersion,
    isOldFirmware: isOld,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start,
    setTargetTemperature: (celsius) =>
      write("targetTemp", encodeTargetTemperature(celsius)),
    setBoostTemperature: (celsius) =>
      write("boostTemp", encodeBoostTemperature(celsius)),
    setLedBrightness: (value) => write("ledBrightness", encodeUint16(value)),
    setAutoOffCountdown: (seconds) =>
      writeProtected(
        "autoOffCountdown",
        SecurityCode.AUTO_OFF_COUNTDOWN,
        encodeUint16(seconds)
      ),
    heaterOn: () => write("heaterOn", encodeHeaterCommand()),
    heaterOff: () => write("heaterOff", encodeHeaterCommand()),
    async factoryReset() {
      await writeProtected(
        "factoryReset",
        SecurityCode.FACTORY_RESET,
        encodeFactoryReset()
      );
      // Give the device time to restore its defaults, then refresh
      await new Promise((resolve) =>
        setTimeout(resolve, FACTORY_RESET_SETTLE_MS)
      );
      for (const key of RESET_AFFECTED) {
        await read(key);
      }
    },
    dispose,
  };
};

/**
 * Connects to all Crafty services, reads the firmware version and gets the
 * characteristics this firmware supports.
 */
export const connectCrafty = async (
  server: BluetoothRemoteGATTServer,
  queue: PQueue
) => {
  const service = async (uuid: string) => {
    const result = await queue.add(() => server.getPrimaryService(uuid));
    if (!result) throw new Error(`Crafty service ${uuid} not found`);
    return result;
  };
  const control = await service(CraftyServiceUUIDs.Crafty1);
  const deviceInfo = await service(CraftyServiceUUIDs.Crafty2);
  const status = await service(CraftyServiceUUIDs.Crafty3);

  const required = async (s: BluetoothRemoteGATTService, uuid: string) => {
    const result = await queue.add(() => s.getCharacteristic(uuid));
    if (!result) throw new Error(`Crafty characteristic ${uuid} not found`);
    return result;
  };
  const optional = async (s: BluetoothRemoteGATTService, uuid: string) => {
    try {
      return await required(s, uuid);
    } catch (error) {
      console.warn(`Crafty characteristic ${uuid} not available`, error);
      return undefined;
    }
  };

  const firmwareCharacteristic = await required(
    deviceInfo,
    UUID.firmwareVersion
  );
  const firmwareValue = await queue.add(() =>
    firmwareCharacteristic.readValue()
  );
  const firmwareVersion = firmwareValue ? parseText(firmwareValue) : "";
  const isOld = isOldFirmware(firmwareVersion);

  const characteristics: Characteristics = {
    targetTemp: await required(control, UUID.writeTemp),
    currentTemp: await required(control, UUID.currTemperatureChanged),
    boostTemp: await required(control, UUID.writeBoostTemp),
    battery: await required(control, UUID.powerChanged),
    ledBrightness: await required(control, UUID.ledBrightness),
    useHours: await required(status, UUID.useHoursCharacteristic),
    projectRegister: await required(status, UUID.handleProjectRegister),
    statusRegister2: await required(status, UUID.statusRegister2),
  };

  if (!isOld) {
    Object.assign(characteristics, {
      bleFirmwareVersion: await optional(deviceInfo, UUID.firmwareBLEVersion),
      useMinutes: await optional(status, UUID.useMinutesCharacteristic),
      autoOffCountdown: await optional(control, UUID.autoOffCountdown),
      autoOffRemaining: await optional(control, UUID.autoOffCurrentValue),
      heaterOn: await optional(control, UUID.heaterOn),
      heaterOff: await optional(control, UUID.heaterOff),
      securityCode: await optional(status, UUID.sicherheitscode),
      systemStatus: await optional(status, UUID.systemStatusCharacteristic),
      akkuStatus: await optional(status, UUID.akkuStatusCharacteristic),
      akkuStatus2: await optional(status, UUID.akkuStatusCharacteristic2),
      factoryReset: await optional(status, UUID.factoryResetCharacteristic),
    });
  }

  return createCraftyDriver(characteristics, firmwareVersion, queue);
};
