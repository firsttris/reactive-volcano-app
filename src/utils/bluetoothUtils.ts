export const convertBLEToUint16 = (bleBuffer: DataView): number => {
  return bleBuffer.getUint16(0, true);
};

export const convertBLEToUint24 = (bleBuffer: DataView): number => {
  return bleBuffer.getUint16(0, true) + bleBuffer.getUint8(2) * 256 * 256;
};

export const convertBLEToUint32 = (bleBuffer: DataView): number => {
  return bleBuffer.getUint32(0, true);
};

export const convertCelsiusToFahrenheit = (celsius: number): number => {
  return Math.round(celsius * 1.8 + 32);
};

export const convertFahrenheitToCelsius = (fahrenheit: number): number => {
  return Math.round((fahrenheit - 32) / 1.8);
};

export const convertToUInt8BLE = (value: number): ArrayBuffer => {
  const buffer = new ArrayBuffer(1);
  const dataView = new DataView(buffer);
  dataView.setUint8(0, value % 256);
  return buffer;
};

export const convertToUInt16BLE = (value: number): ArrayBuffer => {
  const buffer = new ArrayBuffer(2);
  const dataView = new DataView(buffer);
  dataView.setUint16(0, value, true);
  return buffer;
};

export const convertToUInt32BLE = (value: number): ArrayBuffer => {
  const buffer = new ArrayBuffer(4);
  const dataView = new DataView(buffer);
  dataView.setUint32(0, value, true);
  return buffer;
};
