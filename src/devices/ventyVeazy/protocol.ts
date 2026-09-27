/**
 * Venty / Veazy BLE protocol (derived from qvap.js).
 *
 * All communication runs over a single characteristic: the app writes a
 * command frame whose first byte is the command id, and the device answers
 * with a notification that starts with the same command id.
 *
 * This module only contains pure functions so it can be unit-tested with
 * byte fixtures.
 */

export type VentyVeazyModel = "VENTY" | "VEAZY";

export const Command = {
  STATUS: 0x01,
  FIRMWARE: 0x02,
  EXTENDED_DATA: 0x04,
  DEVICE_DATA: 0x05,
  BRIGHTNESS_VIBRATION: 0x06,
  FIND_MY_DEVICE: 0x0d,
  ADVERTISING_INFO: 0x1d,
} as const;

// Byte 1 of a STATUS write: which fields the device should take over
export const StatusWriteMask = {
  TARGET_TEMPERATURE: 1 << 1,
  BOOST: 1 << 2,
  SUPERBOOST: 1 << 3,
  HEATER: 1 << 5,
  SETTINGS: 1 << 7,
} as const;

// Byte 1 of a BRIGHTNESS_VIBRATION write
export const BrightnessVibrationWriteMask = {
  BRIGHTNESS: 1 << 0,
  VIBRATION: 1 << 3,
  BOOST_TIMEOUT: 1 << 4,
} as const;

// Byte 14 (value) / byte 15 (mask) of a STATUS frame
export const SettingsBit = {
  UNIT_FAHRENHEIT: 1 << 0,
  SETPOINT_REACHED: 1 << 1,
  FACTORY_RESET: 1 << 2,
  CHARGE_CURRENT_OPTIMIZATION: 1 << 3,
  BUTTON_CHANGED_FILLING_CHAMBER: 1 << 4,
  CHARGE_VOLTAGE_LIMIT: 1 << 5,
  BOOST_VISUALIZATION: 1 << 6,
} as const;

// Byte 16 (value) / byte 17 (mask) of a STATUS frame
export const Settings2Bit = {
  BLE_PERMANENT: 1 << 0,
} as const;

// Byte 1 of a FIRMWARE response
export const FirmwareFlag = {
  APPLICATION: 1 << 0,
  INVALID_APPLICATION: 1 << 4,
  INVALID_BOOTLOADER: 1 << 5,
} as const;

export const HeaterMode = {
  OFF: 0,
  NORMAL: 1,
  BOOST: 2,
  SUPERBOOST: 3,
} as const;

export const Limits = {
  MIN_TEMP: 40,
  MAX_TEMP: 210,
  MIN_BOOST: 1,
  MAX_BOOST: 99,
  MIN_BRIGHTNESS: 1,
  MAX_BRIGHTNESS: 9,
} as const;

const FRAME_SIZE = 20;
const BRIGHTNESS_VIBRATION_FRAME_SIZE = 7;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export interface StatusResponse {
  currentTemp: number;
  targetTemp: number;
  boostTemp: number;
  superBoostTemp: number;
  batteryLevel: number;
  autoShutdownTimer: number;
  heaterMode: number;
  isCharging: boolean;
  isCelsius: boolean;
  setpointReached: boolean;
  chargeCurrentOptimization: boolean;
  chargeVoltageLimit: boolean;
  boostVisualization: boolean;
  /** Target temperature was changed with the buttons on the device */
  buttonChanged: boolean;
  permanentBluetooth: boolean;
}

export interface FirmwareResponse {
  flags: number;
  isApplicationMode: boolean;
  firmwareVersion: string;
  bootloaderVersion: string;
}

export interface ExtendedDataResponse {
  heaterRuntimeMinutes: number;
  batteryChargingTimeMinutes: number;
}

export interface DeviceDataResponse {
  serialNumber: string;
  colorIndex: number | null;
}

export interface BrightnessVibrationResponse {
  brightness: number;
  vibration: boolean;
  boostTimeoutDisabled: boolean;
}

export interface AdvertisingInfoResponse {
  findMyDeviceActive: boolean;
}

export type Response =
  | { command: typeof Command.STATUS; data: StatusResponse }
  | { command: typeof Command.FIRMWARE; data: FirmwareResponse }
  | { command: typeof Command.EXTENDED_DATA; data: ExtendedDataResponse }
  | { command: typeof Command.DEVICE_DATA; data: DeviceDataResponse }
  | {
      command: typeof Command.BRIGHTNESS_VIBRATION;
      data: BrightnessVibrationResponse;
    }
  | { command: typeof Command.ADVERTISING_INFO; data: AdvertisingInfoResponse };

const decodeAscii = (value: DataView, start: number, length: number) =>
  new TextDecoder("utf-8").decode(
    new Uint8Array(value.buffer, value.byteOffset + start, length)
  );

const uint24 = (value: DataView, offset: number) =>
  value.getUint8(offset) +
  value.getUint8(offset + 1) * 256 +
  value.getUint8(offset + 2) * 65536;

export const parseStatus = (
  value: DataView,
  model: VentyVeazyModel
): StatusResponse | null => {
  if (value.byteLength < 15) return null;
  const settings = value.getUint8(14);
  const boostVisualizationBit = !!(settings & SettingsBit.BOOST_VISUALIZATION);
  return {
    currentTemp: Math.round(value.getUint16(2, true) / 10),
    targetTemp: Math.round(value.getUint16(4, true) / 10),
    boostTemp: value.getUint8(6),
    superBoostTemp: value.getUint8(7),
    batteryLevel: value.getUint8(8),
    // The original app adds both bytes (not a uint16), so do the same
    autoShutdownTimer: value.getUint8(9) + value.getUint8(10),
    heaterMode: value.getUint8(11),
    isCharging: value.getUint8(13) > 0,
    isCelsius: !(settings & SettingsBit.UNIT_FAHRENHEIT),
    setpointReached: !!(settings & SettingsBit.SETPOINT_REACHED),
    chargeCurrentOptimization: !!(
      settings & SettingsBit.CHARGE_CURRENT_OPTIMIZATION
    ),
    chargeVoltageLimit: !!(settings & SettingsBit.CHARGE_VOLTAGE_LIMIT),
    // The Veazy reports this bit inverted
    boostVisualization:
      model === "VEAZY" ? !boostVisualizationBit : boostVisualizationBit,
    buttonChanged: !!(settings & SettingsBit.BUTTON_CHANGED_FILLING_CHAMBER),
    permanentBluetooth:
      value.byteLength >= 17 &&
      !!(value.getUint8(16) & Settings2Bit.BLE_PERMANENT),
  };
};

export const parseFirmware = (value: DataView): FirmwareResponse | null => {
  if (value.byteLength < 19) return null;
  const flags = value.getUint8(1);
  return {
    flags,
    isApplicationMode: !!(flags & FirmwareFlag.APPLICATION),
    firmwareVersion: decodeAscii(value, 2, 6),
    bootloaderVersion: decodeAscii(value, 11, 6),
  };
};

export const parseExtendedData = (
  value: DataView
): ExtendedDataResponse | null => {
  if (value.byteLength < 20) return null;
  return {
    heaterRuntimeMinutes: uint24(value, 1),
    batteryChargingTimeMinutes: uint24(value, 4),
  };
};

export const parseDeviceData = (value: DataView): DeviceDataResponse | null => {
  if (value.byteLength < 18) return null;
  return {
    serialNumber: decodeAscii(value, 15, 2) + decodeAscii(value, 9, 6),
    colorIndex: value.byteLength > 18 ? value.getUint8(18) : null,
  };
};

export const parseBrightnessVibration = (
  value: DataView
): BrightnessVibrationResponse | null => {
  if (value.byteLength < 7) return null;
  return {
    brightness: value.getUint8(2),
    vibration: value.getUint8(5) !== 0,
    boostTimeoutDisabled: value.getUint8(6) !== 0,
  };
};

export const parseAdvertisingInfo = (
  value: DataView
): AdvertisingInfoResponse | null => {
  if (value.byteLength < 2) return null;
  return { findMyDeviceActive: !!(value.getUint8(1) & (1 << 4)) };
};

/** Parses a notification; returns null for unknown or malformed frames */
export const parseResponse = (
  value: DataView,
  model: VentyVeazyModel
): Response | null => {
  if (value.byteLength < 1) return null;
  const command = value.getUint8(0);
  switch (command) {
    case Command.STATUS: {
      const data = parseStatus(value, model);
      return data && { command, data };
    }
    case Command.FIRMWARE: {
      const data = parseFirmware(value);
      return data && { command, data };
    }
    case Command.EXTENDED_DATA: {
      const data = parseExtendedData(value);
      return data && { command, data };
    }
    case Command.DEVICE_DATA: {
      const data = parseDeviceData(value);
      return data && { command, data };
    }
    case Command.BRIGHTNESS_VIBRATION: {
      const data = parseBrightnessVibration(value);
      return data && { command, data };
    }
    case Command.ADVERTISING_INFO: {
      const data = parseAdvertisingInfo(value);
      return data && { command, data };
    }
    default:
      return null;
  }
};

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

const frame = (bytes: Record<number, number>, size = FRAME_SIZE) => {
  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);
  for (const [index, byte] of Object.entries(bytes)) {
    view.setUint8(Number(index), byte);
  }
  return buffer;
};

/** Plain read request (e.g. STATUS poll, FIRMWARE, DEVICE_DATA) */
export const encodeRequest = (command: number) => frame({ 0: command });

export const encodeReadBrightnessVibration = () =>
  frame({ 0: Command.BRIGHTNESS_VIBRATION }, BRIGHTNESS_VIBRATION_FRAME_SIZE);

export const encodeTargetTemperature = (celsius: number) => {
  const value =
    clamp(Math.round(celsius), Limits.MIN_TEMP, Limits.MAX_TEMP) * 10;
  return frame({
    0: Command.STATUS,
    1: StatusWriteMask.TARGET_TEMPERATURE,
    4: value & 0xff,
    5: (value >> 8) & 0xff,
  });
};

export const encodeBoostTemperature = (offset: number) =>
  frame({
    0: Command.STATUS,
    1: StatusWriteMask.BOOST,
    6: clamp(Math.round(offset), Limits.MIN_BOOST, Limits.MAX_BOOST),
  });

export const encodeSuperBoostTemperature = (offset: number) =>
  frame({
    0: Command.STATUS,
    1: StatusWriteMask.SUPERBOOST,
    7: clamp(Math.round(offset), Limits.MIN_BOOST, Limits.MAX_BOOST),
  });

export const encodeHeaterMode = (mode: number) =>
  frame({ 0: Command.STATUS, 1: StatusWriteMask.HEATER, 11: mode });

/** Sets or clears one bit of the settings byte (byte 14, mask in byte 15) */
export const encodeSettingsBit = (bit: number, enabled: boolean) =>
  frame({
    0: Command.STATUS,
    1: StatusWriteMask.SETTINGS,
    14: enabled ? bit : 0,
    15: bit,
  });

export const encodeIsCelsius = (isCelsius: boolean) =>
  encodeSettingsBit(SettingsBit.UNIT_FAHRENHEIT, !isCelsius);

export const encodeBoostVisualization = (
  enabled: boolean,
  model: VentyVeazyModel
) =>
  encodeSettingsBit(
    SettingsBit.BOOST_VISUALIZATION,
    model === "VEAZY" ? !enabled : enabled
  );

export const encodeFactoryReset = () =>
  encodeSettingsBit(SettingsBit.FACTORY_RESET, true);

export const encodePermanentBluetooth = (enabled: boolean) =>
  frame({
    0: Command.STATUS,
    1: StatusWriteMask.SETTINGS,
    16: enabled ? Settings2Bit.BLE_PERMANENT : 0,
    17: Settings2Bit.BLE_PERMANENT,
  });

export const encodeBrightness = (brightness: number) =>
  frame(
    {
      0: Command.BRIGHTNESS_VIBRATION,
      1: BrightnessVibrationWriteMask.BRIGHTNESS,
      2: clamp(
        Math.round(brightness),
        Limits.MIN_BRIGHTNESS,
        Limits.MAX_BRIGHTNESS
      ),
    },
    BRIGHTNESS_VIBRATION_FRAME_SIZE
  );

export const encodeVibration = (enabled: boolean) =>
  frame(
    {
      0: Command.BRIGHTNESS_VIBRATION,
      1: BrightnessVibrationWriteMask.VIBRATION,
      5: enabled ? 1 : 0,
    },
    BRIGHTNESS_VIBRATION_FRAME_SIZE
  );

export const encodeBoostTimeoutDisabled = (disabled: boolean) =>
  frame(
    {
      0: Command.BRIGHTNESS_VIBRATION,
      1: BrightnessVibrationWriteMask.BOOST_TIMEOUT,
      6: disabled ? 1 : 0,
    },
    BRIGHTNESS_VIBRATION_FRAME_SIZE
  );

export const encodeFindMyDevice = () =>
  frame({ 0: Command.FIND_MY_DEVICE, 1: 0x01 });

/** Display helpers: the device always works in °C internally */
export const toDisplayTemperature = (celsius: number, isCelsius: boolean) =>
  isCelsius ? celsius : Math.round(celsius * 1.8 + 32);

/** Boost offsets in °F are shown as a temperature difference (×1.8) */
export const toDisplayOffset = (celsius: number, isCelsius: boolean) =>
  isCelsius ? celsius : Math.round(celsius * 1.8);
