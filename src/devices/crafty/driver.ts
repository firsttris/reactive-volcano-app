import type PQueue from "p-queue";
import {
  CraftyServiceUUIDs,
  CraftyCharacteristicUUIDs as UUID,
} from "../../utils/uuids";
import {
  createCharacteristicDevice,
  getOptionalCharacteristic,
  getRequiredCharacteristic,
  getService,
  type Reader,
  type UpdateListener,
} from "../shared/characteristicDevice";
import {
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
  SecurityCode,
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
export type CraftyUpdateListener = UpdateListener<CraftyValues>;

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

// How each readable characteristic maps onto CraftyValues
const readers: Partial<Record<keyof Characteristics, Reader<CraftyValues>>> = {
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
  const device = createCharacteristicDevice<
    keyof Characteristics,
    CraftyValues
  >(
    {
      characteristics: { ...characteristics },
      readers,
      // Old firmware does not support notifications on the project register
      notifying: isOld
        ? NOTIFYING.filter((key) => key !== "projectRegister")
        : NOTIFYING,
      name: "Crafty",
    },
    queue
  );

  return {
    firmwareVersion,
    isOldFirmware: isOld,
    subscribe: device.subscribe,
    start: device.start,
    setTargetTemperature: (celsius) =>
      device.write("targetTemp", encodeTargetTemperature(celsius)),
    setBoostTemperature: (celsius) =>
      device.write("boostTemp", encodeBoostTemperature(celsius)),
    setLedBrightness: (value) =>
      device.write("ledBrightness", encodeUint16(value)),
    setAutoOffCountdown: (seconds) =>
      device.writeSequence([
        ["securityCode", encodeUint16(SecurityCode.AUTO_OFF_COUNTDOWN)],
        ["autoOffCountdown", encodeUint16(seconds)],
      ]),
    heaterOn: () => device.write("heaterOn", encodeHeaterCommand()),
    heaterOff: () => device.write("heaterOff", encodeHeaterCommand()),
    async factoryReset() {
      await device.writeSequence([
        ["securityCode", encodeUint16(SecurityCode.FACTORY_RESET)],
        ["factoryReset", encodeFactoryReset()],
      ]);
      // Give the device time to restore its defaults, then refresh
      await new Promise((resolve) =>
        setTimeout(resolve, FACTORY_RESET_SETTLE_MS)
      );
      for (const key of RESET_AFFECTED) {
        await device.read(key);
      }
    },
    dispose: device.dispose,
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
  const control = await getService(server, CraftyServiceUUIDs.Crafty1, queue);
  const deviceInfo = await getService(
    server,
    CraftyServiceUUIDs.Crafty2,
    queue
  );
  const status = await getService(server, CraftyServiceUUIDs.Crafty3, queue);

  const required = (s: BluetoothRemoteGATTService, uuid: string) =>
    getRequiredCharacteristic(s, uuid, queue);
  const optional = (s: BluetoothRemoteGATTService, uuid: string) =>
    getOptionalCharacteristic(s, uuid, queue);

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
