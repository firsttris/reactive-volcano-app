/**
 * Crafty / Crafty+ BLE protocol (derived from crafty.js of the S&B web app).
 *
 * Unlike the Venty/Veazy, every value has its own characteristic. Values are
 * little-endian uint16, temperatures in 1/10 °C.
 *
 * This module only contains pure functions so it can be unit-tested.
 */

// Project register (0x93)
export const ProjectRegisterBit = {
  HEATER_ACTIVE: 1 << 4,
  BOOST_MODE: 1 << 5,
  SUPERBOOST_MODE: 1 << 6,
} as const;

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
 * Old Crafty firmware (before 2.51) lacks most characteristics. Same check
 * as the legacy app: the version looks like "V02.51".
 */
export const isOldFirmware = (version: string) => {
  const trimmed = version.trim();
  const major = parseInt(trimmed.substring(1, 3), 10);
  const minor = parseInt(trimmed.slice(-2), 10);
  if (Number.isNaN(major) || Number.isNaN(minor)) return false;
  return minor < 51 && major <= 2;
};

export const isHeaterActive = (projectRegister: number) =>
  (projectRegister & ProjectRegisterBit.HEATER_ACTIVE) !== 0;

export const isSetpointReached = (statusRegister2: number) =>
  (statusRegister2 & StatusRegister2Bit.SETPOINT_REACHED) !== 0;

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

/** Heater on/off take a 2-byte zero value (like the legacy app) */
export const encodeHeaterCommand = () => encodeUint16(0);

export const encodeFactoryReset = () => new ArrayBuffer(1);
