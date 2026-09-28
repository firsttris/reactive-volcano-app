import type PQueue from "p-queue";
import {
  ServiceUUIDs,
  VolcanoCharacteristicUUIDs as UUID,
} from "../../utils/uuids";
import {
  createCharacteristicDevice,
  getRequiredCharacteristic,
  getService,
  type Reader,
  type UpdateListener,
} from "../shared/characteristicDevice";
import {
  encodeCommand,
  encodeRegisterBit,
  encodeTargetTemperature,
  encodeUint16,
  parseCurrentTemperature,
  parseShortText,
  parseTemperature,
  parseText,
  parseUint16,
  Register2Bit,
  Register3Bit,
} from "./protocol";

export interface VolcanoValues {
  targetTemp: number;
  currentTemp: number;
  register1: number;
  register2: number;
  register3: number;
  autoOffRemaining: number;
  shutoffTime: number;
  brightness: number;
  heatingHours: number;
  heatingMinutes: number;
}

export interface VolcanoInfo {
  serialNumber: string;
  firmwareVersion: string;
  bleFirmwareVersion: string;
}

type Characteristic = BluetoothRemoteGATTCharacteristic;

interface Characteristics {
  targetTemp: Characteristic;
  currentTemp: Characteristic;
  register1: Characteristic;
  register2: Characteristic;
  register3: Characteristic;
  autoOffRemaining: Characteristic;
  shutoffTime: Characteristic;
  brightness: Characteristic;
  heatingHours: Characteristic;
  heatingMinutes: Characteristic;
  heaterOn: Characteristic;
  heaterOff: Characteristic;
  pumpOn: Characteristic;
  pumpOff: Characteristic;
}

const readers: Partial<Record<keyof Characteristics, Reader<VolcanoValues>>> = {
  targetTemp: (v) => ({ targetTemp: parseTemperature(v) }),
  currentTemp: (v) => {
    const currentTemp = parseCurrentTemperature(v);
    return currentTemp === null ? {} : { currentTemp };
  },
  register1: (v) => ({ register1: parseUint16(v) }),
  register2: (v) => ({ register2: parseUint16(v) }),
  register3: (v) => ({ register3: parseUint16(v) }),
  autoOffRemaining: (v) => ({ autoOffRemaining: parseUint16(v) }),
  shutoffTime: (v) => ({ shutoffTime: parseUint16(v) }),
  brightness: (v) => ({ brightness: parseUint16(v) }),
  heatingHours: (v) => ({ heatingHours: parseUint16(v) }),
  heatingMinutes: (v) => ({ heatingMinutes: parseUint16(v) }),
};

// Characteristics the device pushes changes for (like the legacy app)
const NOTIFYING: (keyof Characteristics)[] = [
  "targetTemp",
  "currentTemp",
  "register1",
  "register2",
  "autoOffRemaining",
  "heatingHours",
  "heatingMinutes",
];

export interface VolcanoDriver {
  readonly info: VolcanoInfo;
  subscribe(listener: UpdateListener<VolcanoValues>): () => void;
  /** Reads all values and enables notifications */
  start(): Promise<void>;
  setTargetTemperature(celsius: number): Promise<void>;
  heaterOn(): Promise<void>;
  heaterOff(): Promise<void>;
  pumpOn(): Promise<void>;
  pumpOff(): Promise<void>;
  setShutoffTime(seconds: number): Promise<void>;
  setBrightness(value: number): Promise<void>;
  setVibration(enabled: boolean): Promise<void>;
  setDisplayOnCooling(enabled: boolean): Promise<void>;
  dispose(): Promise<void>;
}

export const createVolcanoDriver = (
  characteristics: Characteristics,
  info: VolcanoInfo,
  queue: PQueue
): VolcanoDriver => {
  const device = createCharacteristicDevice<
    keyof Characteristics,
    VolcanoValues
  >(
    {
      characteristics: { ...characteristics },
      readers,
      notifying: NOTIFYING,
      name: "Volcano",
    },
    queue
  );

  return {
    info,
    subscribe: device.subscribe,
    start: device.start,
    setTargetTemperature: (celsius) =>
      device.write("targetTemp", encodeTargetTemperature(celsius)),
    heaterOn: () => device.write("heaterOn", encodeCommand()),
    heaterOff: () => device.write("heaterOff", encodeCommand()),
    pumpOn: () => device.write("pumpOn", encodeCommand()),
    pumpOff: () => device.write("pumpOff", encodeCommand()),
    setShutoffTime: (seconds) =>
      device.write("shutoffTime", encodeUint16(seconds)),
    setBrightness: (value) => device.write("brightness", encodeUint16(value)),
    async setVibration(enabled) {
      await device.write(
        "register3",
        encodeRegisterBit(Register3Bit.VIBRATION_DISABLED, !enabled)
      );
      // Register 3 has no notifications, so read the new value back
      await device.read("register3");
    },
    setDisplayOnCooling: (enabled) =>
      device.write(
        "register2",
        encodeRegisterBit(Register2Bit.DISPLAY_ON_COOLING_DISABLED, !enabled)
      ),
    dispose: device.dispose,
  };
};

/** Connects to the Volcano services and reads the device information */
export const connectVolcano = async (
  server: BluetoothRemoteGATTServer,
  queue: PQueue
) => {
  const state = await getService(server, ServiceUUIDs.DeviceState, queue);
  const control = await getService(server, ServiceUUIDs.DeviceControl, queue);
  const required = (s: BluetoothRemoteGATTService, uuid: string) =>
    getRequiredCharacteristic(s, uuid, queue);

  const readText = async (uuid: string, parse: (v: DataView) => string) => {
    const characteristic = await required(state, uuid);
    const value = await queue.add(() => characteristic.readValue());
    return value ? parse(value) : "";
  };

  const info: VolcanoInfo = {
    serialNumber: await readText(UUID.serialNumber, parseShortText),
    firmwareVersion: await readText(UUID.firmwareVersion, parseShortText),
    bleFirmwareVersion: await readText(UUID.firmwareBLEVersion, parseText),
  };

  const characteristics: Characteristics = {
    register1: await required(state, UUID.activity),
    register2: await required(state, UUID.display),
    register3: await required(state, UUID.vibration),
    targetTemp: await required(control, UUID.targetTemperature),
    currentTemp: await required(control, UUID.currentTemperature),
    autoOffRemaining: await required(control, UUID.currentAutoOffValue),
    shutoffTime: await required(control, UUID.shutoffTime),
    brightness: await required(control, UUID.brightness),
    heatingHours: await required(control, UUID.hoursOfHeating),
    heatingMinutes: await required(control, UUID.minutesOfHeating),
    heaterOn: await required(control, UUID.heaterOn),
    heaterOff: await required(control, UUID.heaterOff),
    pumpOn: await required(control, UUID.pumpOn),
    pumpOff: await required(control, UUID.pumpOff),
  };

  return createVolcanoDriver(characteristics, info, queue);
};
