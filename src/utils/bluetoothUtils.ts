export const convertBLEToUint16 = (bleBuffer: DataView): number => {
  // Robuste Konvertierung - kann mit verschiedenen Buffer-Größen umgehen
  if (bleBuffer.byteLength === 0) {
    return 0;
  }

  if (bleBuffer.byteLength === 1) {
    // 1 Byte: Lese als Uint8
    return bleBuffer.getUint8(0);
  }

  if (bleBuffer.byteLength >= 2) {
    // 2+ Bytes: Lese als Uint16
    return bleBuffer.getUint16(0, true);
  }

  return 0;
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
