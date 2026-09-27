/**
 * Volcano Hybrid BLE protocol (derived from volcano.js).
 *
 * Every value has its own characteristic. Temperatures are in 1/10 °C.
 * The three project registers are changed with a 32-bit write: the lower
 * 16 bits select the bit, 0x10000 means "set" (otherwise it is cleared).
 *
 * This module only contains pure functions so it can be unit-tested.
 */

// Project register 1 ("activity", 0x1010000c)
export const Register1Bit = {
  HEATER: 0x0020,
  AUTO_SHUTDOWN: 0x0200,
  PUMP: 0x2000,
} as const;

// Project register 2 ("display", 0x1010000d)
export const Register2Bit = {
  FAHRENHEIT: 0x0200,
  // Set = display is *off* while cooling down
  DISPLAY_ON_COOLING_DISABLED: 0x1000,
} as const;

// Project register 3 ("vibration", 0x1010000e)
export const Register3Bit = {
  // Set = vibration is *off*
  VIBRATION_DISABLED: 0x0400,
} as const;

export const Limits = {
  MIN_TEMP: 40,
  MAX_TEMP: 230,
  MIN_BRIGHTNESS: 0,
  MAX_BRIGHTNESS: 100,
} as const;

const SET_BIT_FLAG = 0x10000;
// The legacy app ignores current temperatures above this raw value
const MAX_VALID_TEMPERATURE = 6536;

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

/** Returns null for the invalid values the device sends while starting */
export const parseCurrentTemperature = (value: DataView) => {
  const temperature = parseTemperature(value);
  return temperature < MAX_VALID_TEMPERATURE ? temperature : null;
};

export const parseText = (value: DataView) =>
  new TextDecoder("utf-8")
    .decode(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
    .replace(/\0+$/, "");

/** Serial number and firmware version are the first 8 characters */
export const parseShortText = (value: DataView) =>
  parseText(value).substring(0, 8);

export const hasBit = (register: number, bit: number) => (register & bit) !== 0;

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

export const encodeUint8 = (value: number) => {
  const buffer = new ArrayBuffer(1);
  new DataView(buffer).setUint8(0, value & 0xff);
  return buffer;
};

export const encodeUint16 = (value: number) => {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setUint16(0, Math.round(value) & 0xffff, true);
  return buffer;
};

export const encodeUint32 = (value: number) => {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setUint32(0, Math.round(value), true);
  return buffer;
};

export const encodeTargetTemperature = (celsius: number) =>
  encodeUint32(clamp(celsius, Limits.MIN_TEMP, Limits.MAX_TEMP) * 10);

/** Heater and pump on/off take a single zero byte */
export const encodeCommand = () => encodeUint8(0);

/** Sets or clears one bit of a project register */
export const encodeRegisterBit = (bit: number, set: boolean) =>
  encodeUint32(set ? SET_BIT_FLAG + bit : bit);
