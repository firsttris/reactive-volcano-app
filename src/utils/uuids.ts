export enum States {
  HEIZUNG_ENA = 0x0020,
  ENABLE_AUTOBLESHUTDOWN = 0x0200,
  PUMPE_FET_ENABLE = 0x2000,
  FAHRENHEIT_ENA = 0x200,
  DISPLAY_ON_COOLING = 0x1000,
  VIBRATION = 0x400,
}

// Veazy/Venty Write Masks (from qvap.js)
export enum VentyVeazyWriteMasks {
  SET_TEMPERATURE = 1 << 1,
  SET_BOOST = 1 << 2,
  SET_SUPERBOOST = 1 << 3,
  HEATER = 1 << 5,
  SETTINGS = 1 << 7,
}

// Veazy/Venty Settings Bits (from qvap.js)
export enum VentyVeazySettingsBits {
  UNIT = 1 << 0,
  SETPOINT_REACHED = 1 << 1,
  FACTORY_RESET = 1 << 2,
  ECOMODE_CHARGE = 1 << 3,
  BUTTON_CHANGED_FILLING_CHAMBER = 1 << 4,
  ECOMODE_VOLTAGE = 1 << 5,
  BOOST_VISUALIZATION = 1 << 6,
}

export enum VentyVeazySettings2Bits {
  BLE_PERMANENT = 1 << 0,
}

// Volcano Services
export enum VolcanoServiceUUIDs {
  Bootloader = "00000001-1989-0108-1234-123456789abc",
  Service2 = "01000002-1989-0108-1234-123456789abc",
  DeviceState = "10100000-5354-4f52-5a26-4249434b454c",
  DeviceControl = "10110000-5354-4f52-5a26-4249434b454c",
  Service5 = "10130000-5354-4f52-5a26-4249434b454c",
}

// Venty/Veazy Services
export enum VentyVeazyServiceUUIDs {
  Primary = "00000000-5354-4f52-5a26-4249434b454c",
  GenericAccess = "00001800-0000-1000-8000-00805f9b34fb",
}

// Crafty Services
export enum CraftyServiceUUIDs {
  Service1 = "00000001-4c45-4b43-4942-265a524f5453",
  Service2 = "00000002-4c45-4b43-4942-265a524f5453",
  Service3 = "00000003-4c45-4b43-4942-265a524f5453",
}

// Crafty Characteristics
export enum CraftyCharacteristicUUIDs {
  targetTemperature = "00000021-4c45-4b43-4942-265a524f5453",
  currentTemperature = "00000011-4c45-4b43-4942-265a524f5453",
  boostTemperature = "00000031-4c45-4b43-4942-265a524f5453",
  serialNumber = "00000052-4c45-4b43-4942-265a524f5453",
  firmwareVersion = "00000032-4c45-4b43-4942-265a524f5453",
  statusRegister2 = "000001c3-4c45-4b43-4942-265a524f5453",
  useHours = "00000023-4c45-4b43-4942-265a524f5453",
  useMinutes = "000001e3-4c45-4b43-4942-265a524f5453",
  firmwareBLEVersion = "00000072-4c45-4b43-4942-265a524f5453",
  brightness = "00000051-4c45-4b43-4942-265a524f5453",
  autoOffCountdown = "00000061-4c45-4b43-4942-265a524f5453",
  autoOffCurrentValue = "00000071-4c45-4b43-4942-265a524f5453",
  battery = "00000041-4c45-4b43-4942-265a524f5453",
  heaterOn = "00000081-4c45-4b43-4942-265a524f5453",
  heaterOff = "00000091-4c45-4b43-4942-265a524f5453",
  projectRegister = "00000093-4c45-4b43-4942-265a524f5453",
  securityCode = "000001b3-4c45-4b43-4942-265a524f5453",
  systemStatus = "00000083-4c45-4b43-4942-265a524f5453",
  batteryStatus = "00000063-4c45-4b43-4942-265a524f5453",
  batteryStatus2 = "00000073-4c45-4b43-4942-265a524f5453",
  factoryReset = "000001d3-4c45-4b43-4942-265a524f5453",
}

// Volcano Characteristics
export enum VolcanoCharacteristicUUIDs {
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

// Venty/Veazy Characteristics
export enum VentyVeazyCharacteristicUUIDs {
  control = "00000001-5354-4f52-5a26-4249434b454c",
  deviceName = "00002a00-0000-1000-8000-00805f9b34fb",
}

// Backward compatibility - explicit mapping to avoid conflicts
export const ServiceUUIDs = {
  // Volcano services
  Bootloader: VolcanoServiceUUIDs.Bootloader,
  Service2: VolcanoServiceUUIDs.Service2,
  DeviceState: VolcanoServiceUUIDs.DeviceState,
  DeviceControl: VolcanoServiceUUIDs.DeviceControl,
  Service5: VolcanoServiceUUIDs.Service5,

  // Veazy/Venty services
  Primary: VentyVeazyServiceUUIDs.Primary,
  GenericAccess: VentyVeazyServiceUUIDs.GenericAccess,

  // Crafty services
  Crafty1: CraftyServiceUUIDs.Service1,
  Crafty2: CraftyServiceUUIDs.Service2,
  Crafty3: CraftyServiceUUIDs.Service3,
};

export const CharateristicUUIDs = {
  ...VolcanoCharacteristicUUIDs,
  ...VentyVeazyCharacteristicUUIDs,
  ...CraftyCharacteristicUUIDs,
};

// Device-specific characteristic types
export type VolcanoCharacteristics = Record<
  keyof typeof VolcanoCharacteristicUUIDs,
  BluetoothRemoteGATTCharacteristic | undefined
>;

export type VentyVeazyCharacteristics = Record<
  keyof typeof VentyVeazyCharacteristicUUIDs,
  BluetoothRemoteGATTCharacteristic | undefined
>;

export type CraftyCharacteristics = Record<
  keyof typeof CraftyCharacteristicUUIDs,
  BluetoothRemoteGATTCharacteristic | undefined
>;

export type CharateristicUUIDsKeys = keyof typeof CharateristicUUIDs;

export enum ConnectionState {
  NOT_CONNECTED = "NOT_CONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  CONNECTION_FAILED = "CONNECTION_FAILED",
}

export enum DeviceType {
  VOLCANO = "VOLCANO",
  VEAZY = "VEAZY",
  VENTY = "VENTY",
  CRAFTY = "CRAFTY",
  UNKNOWN = "UNKNOWN",
}
