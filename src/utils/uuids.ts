export enum States {
  HEIZUNG_ENA = 0x0020,
  ENABLE_AUTOBLESHUTDOWN = 0x0200,
  PUMPE_FET_ENABLE = 0x2000,
  FAHRENHEIT_ENA = 0x200,
  DISPLAY_ON_COOLING = 0x1000,
  VIBRATION = 0x400,
}

export enum ServiceUUIDs {
  Bootloader = "00000001-1989-0108-1234-123456789abc",
  Service2 = "01000002-1989-0108-1234-123456789abc",
  DeviceState = "10100000-5354-4f52-5a26-4249434b454c",
  DeviceControl = "10110000-5354-4f52-5a26-4249434b454c",
  Service5 = "10130000-5354-4f52-5a26-4249434b454c",
}

export enum CharateristicUUIDs {
  display = "1010000d-5354-4f52-5a26-4249434b454c",
  targetTemperature = "10110003-5354-4f52-5a26-4249434b454c",
  currentTemperature = "10110001-5354-4f52-5a26-4249434b454c",
  heaterOn = "1011000f-5354-4f52-5a26-4249434b454c",
  heaterOff = "10110010-5354-4f52-5a26-4249434b454c",
  pumpOff = "10110014-5354-4f52-5a26-4249434b454c",
  pumpOn = "10110013-5354-4f52-5a26-4249434b454c",
  serialNumber = "10100008-5354-4f52-5a26-4249434b454c",
  firmwareVersion = "10100003-5354-4f52-5a26-4249434b454c",
  firmwareBLEVersion = "10100004-5354-4f52-5a26-4249434b454c",
  currentAutoOffValue = "1011000c-5354-4f52-5a26-4249434b454c",
  hoursOfHeating = "10110015-5354-4f52-5a26-4249434b454c",
  minutesOfHeating = "10110016-5354-4f52-5a26-4249434b454c",
  activity = "1010000c-5354-4f52-5a26-4249434b454c",
  vibration = "1010000e-5354-4f52-5a26-4249434b454c",
  shutoffTime = "1011000d-5354-4f52-5a26-4249434b454c",
  brightness = "10110005-5354-4f52-5a26-4249434b454c",
}

export type CharateristicUUIDsKeys = keyof typeof CharateristicUUIDs;

export type VolcanoCharacteristics = Record<
  keyof typeof CharateristicUUIDs,
  BluetoothRemoteGATTCharacteristic | undefined
>;

export const initialCharacteristics = Object.fromEntries(
  Object.keys(CharateristicUUIDs).map((key) => [key, undefined])
) as VolcanoCharacteristics;

export enum ConnectionState {
  NOT_CONNECTED = "NOT_CONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  CONNECTION_FAILED = "CONNECTION_FAILED",
}
