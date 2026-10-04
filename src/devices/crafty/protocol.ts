/**
 * Crafty / Crafty+ BLE protocol.
 *
 * Unlike the Venty/Veazy, every value has its own characteristic. Values are
 * little-endian uint16, temperatures in 1/10 °C.
 *
 * This module only contains pure functions so it can be unit-tested.
 */

import {
  type AnalysisFinding,
  type AnalysisResult,
  formatErrorReport,
  toHex,
} from "../shared/analysis";

// Project register (0x93)
export const ProjectRegisterBit = {
  HEATER_ACTIVE: 1 << 4,
  BOOST_MODE: 1 << 5,
  SUPERBOOST_MODE: 1 << 6,
  FACTORY_RESET_REQUIRED: 1 << 15,
} as const;

// Masks checked by the self-check (their exact meaning is unknown)
const AnalysisMask = {
  PROJECT_ERROR: 0x2008,
  AKKU_ERROR: 0x0600,
  SYSTEM_ERROR: 0x0200,
  AKKU_TOO_HOT: 0x4100,
  AKKU_EMPTY: 0x0003,
  AKKU2_BAD_CHARGER: 0x8000,
} as const;

const LOW_BRIGHTNESS = 10;

// Status register 2 (0x1c3)
export const StatusRegister2Bit = {
  DISABLE_VIBRATION: 1 << 0,
  DISABLE_CHARGE_LED: 1 << 1,
  SETPOINT_REACHED: 1 << 2,
  FIND_DEVICE: 1 << 3,
  ENABLE_AUTO_BLE_SHUTDOWN: 1 << 12,
} as const;

// Must be written to the security code characteristic before the protected
// value, otherwise the device ignores the write
export const SecurityCode = {
  AUTO_OFF_COUNTDOWN: 815,
  FACTORY_RESET: 1000,
} as const;

export const Limits = {
  MIN_TEMP: 40,
  MAX_TEMP: 210,
  MIN_BOOST: 0,
  MAX_BOOST: 30,
  MIN_AUTO_OFF: 30,
  MAX_AUTO_OFF: 300,
  MIN_BRIGHTNESS: 0,
  MAX_BRIGHTNESS: 100,
} as const;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export const parseUint16 = (value: DataView) => {
  if (value.byteLength === 0) return 0;
  if (value.byteLength === 1) return value.getUint8(0);
  return value.getUint16(0, true);
};

export const parseTemperature = (value: DataView) =>
  Math.round(parseUint16(value) / 10);

/** A Crafty in Fahrenheit mode reports the target temperature in °F */
export const parseTargetTemperature = (value: DataView) => {
  const temperature = parseTemperature(value);
  return temperature > Limits.MAX_TEMP
    ? Math.round((temperature - 32) / 1.8)
    : temperature;
};

export const parseText = (value: DataView) =>
  new TextDecoder("utf-8")
    .decode(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
    .replace(/\0+$/, "");

/** BLE firmware is 3 bytes (major, minor, patch) */
export const parseBleFirmwareVersion = (value: DataView) =>
  value.byteLength >= 3
    ? `V${value.getUint8(0)}.${value.getUint8(1)}.${value.getUint8(2)}`
    : String(parseUint16(value));

/**
 * Old Crafty firmware (before 2.51) lacks most characteristics. The version
 * looks like "V02.51".
 */
export const isOldFirmware = (version: string) => {
  const trimmed = version.trim();
  const major = parseInt(trimmed.substring(1, 3), 10);
  const minor = parseInt(trimmed.slice(-2), 10);
  if (Number.isNaN(major) || Number.isNaN(minor)) return false;
  return minor < 51 && major <= 2;
};

/** Crafty+ ships with firmware 3.x or newer */
export const isCraftyPlus = (version: string) => {
  const major = parseInt(version.trim().substring(1, 3), 10);
  return !Number.isNaN(major) && major >= 3;
};

/** Serial number is the first 8 characters */
export const parseSerialNumber = (value: DataView) =>
  parseText(value).substring(0, 8);

export const isHeaterActive = (projectRegister: number) =>
  (projectRegister & ProjectRegisterBit.HEATER_ACTIVE) !== 0;

export const isSetpointReached = (statusRegister2: number) =>
  (statusRegister2 & StatusRegister2Bit.SETPOINT_REACHED) !== 0;

export const hasBit = (register: number, bit: number) => (register & bit) !== 0;

/** Returns the register with one bit set or cleared */
export const withBit = (register: number, bit: number, set: boolean) =>
  set ? register | bit : register & ~bit;

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

export const encodeUint16 = (value: number) => {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setUint16(0, Math.round(value) & 0xffff, true);
  return buffer;
};

export const encodeTargetTemperature = (celsius: number) =>
  encodeUint16(clamp(celsius, Limits.MIN_TEMP, Limits.MAX_TEMP) * 10);

export const encodeBoostTemperature = (celsius: number) =>
  encodeUint16(clamp(celsius, Limits.MIN_BOOST, Limits.MAX_BOOST) * 10);

/** Heater on/off take a 2-byte zero value */
export const encodeHeaterCommand = () => encodeUint16(0);

export const encodeFactoryReset = () => new ArrayBuffer(1);

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface CraftyAnalysisInput {
  projectRegister: number;
  statusRegister2: number;
  akkuStatus: number;
  akkuStatus2: number;
  systemStatus: number;
  ledBrightness: number;
  serialNumber: string;
  now: Date;
}

/** Turns the register values into an analysis result */
export const analyzeCrafty = (input: CraftyAnalysisInput): AnalysisResult => {
  const hasError =
    hasBit(input.akkuStatus, AnalysisMask.AKKU_ERROR) ||
    hasBit(input.systemStatus, AnalysisMask.SYSTEM_ERROR) ||
    hasBit(input.projectRegister, AnalysisMask.PROJECT_ERROR);
  if (hasError) {
    return {
      errorReport: formatErrorReport(input.serialNumber, input.now, [
        ["val_1", `0x${toHex(input.projectRegister, 4)}`],
        ["val_2", `0x${toHex(input.statusRegister2, 4)}`],
        ["val_3", `0x${toHex(input.akkuStatus, 4)}`],
        ["val_4", `0x${toHex(input.akkuStatus2, 4)}`],
        ["val_5", `0x${toHex(input.systemStatus, 4)}`],
      ]),
      findings: [],
    };
  }

  const findings: AnalysisFinding[] = [];
  if (hasBit(input.akkuStatus, AnalysisMask.AKKU_TOO_HOT)) {
    findings.push("analysis_finding_coolDown");
  } else if (hasBit(input.akkuStatus, AnalysisMask.AKKU_EMPTY)) {
    findings.push("analysis_finding_chargeDevice");
  } else if (hasBit(input.akkuStatus2, AnalysisMask.AKKU2_BAD_CHARGER)) {
    findings.push("analysis_finding_useOtherCharger");
  }
  const register2 = input.statusRegister2;
  if (hasBit(register2, StatusRegister2Bit.DISABLE_VIBRATION)) {
    findings.push("analysis_finding_vibrationDisabled");
  }
  if (hasBit(register2, StatusRegister2Bit.DISABLE_CHARGE_LED)) {
    findings.push("analysis_finding_ledDisabled");
  }
  if (hasBit(register2, StatusRegister2Bit.ENABLE_AUTO_BLE_SHUTDOWN)) {
    findings.push("analysis_finding_bluetoothAlwaysOn");
  }
  if (
    hasBit(input.projectRegister, ProjectRegisterBit.FACTORY_RESET_REQUIRED)
  ) {
    findings.push("analysis_finding_factoryResetNeeded");
  }
  if (input.ledBrightness < LOW_BRIGHTNESS) {
    findings.push("analysis_finding_lowBrightness");
  }
  return { errorReport: null, findings };
};
