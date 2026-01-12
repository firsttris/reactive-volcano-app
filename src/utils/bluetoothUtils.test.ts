import { describe, it, expect } from "vitest";
import {
  convertBLEToUint16,
  convertCelsiusToFahrenheit,
  convertFahrenheitToCelsius,
  convertToUInt8BLE,
  convertToUInt16BLE,
  convertToUInt32BLE,
} from "./bluetoothUtils";

describe("bluetoothUtils", () => {
  describe("convertBLEToUint16", () => {
    it("should return 0 for empty buffer", () => {
      const buffer = new DataView(new ArrayBuffer(0));
      expect(convertBLEToUint16(buffer)).toBe(0);
    });

    it("should convert 1-byte buffer as Uint8", () => {
      const arrayBuffer = new ArrayBuffer(1);
      const dataView = new DataView(arrayBuffer);
      dataView.setUint8(0, 42);
      expect(convertBLEToUint16(dataView)).toBe(42);
    });

    it("should convert 2-byte buffer as little-endian Uint16", () => {
      const arrayBuffer = new ArrayBuffer(2);
      const dataView = new DataView(arrayBuffer);
      dataView.setUint16(0, 1000, true); // little-endian
      expect(convertBLEToUint16(dataView)).toBe(1000);
    });

    it("should convert buffer with more than 2 bytes as Uint16", () => {
      const arrayBuffer = new ArrayBuffer(4);
      const dataView = new DataView(arrayBuffer);
      dataView.setUint16(0, 5000, true);
      expect(convertBLEToUint16(dataView)).toBe(5000);
    });

    it("should handle max Uint8 value (255)", () => {
      const arrayBuffer = new ArrayBuffer(1);
      const dataView = new DataView(arrayBuffer);
      dataView.setUint8(0, 255);
      expect(convertBLEToUint16(dataView)).toBe(255);
    });

    it("should handle max Uint16 value (65535)", () => {
      const arrayBuffer = new ArrayBuffer(2);
      const dataView = new DataView(arrayBuffer);
      dataView.setUint16(0, 65535, true);
      expect(convertBLEToUint16(dataView)).toBe(65535);
    });
  });

  describe("convertCelsiusToFahrenheit", () => {
    it("should convert 0°C to 32°F", () => {
      expect(convertCelsiusToFahrenheit(0)).toBe(32);
    });

    it("should convert 100°C to 212°F", () => {
      expect(convertCelsiusToFahrenheit(100)).toBe(212);
    });

    it("should convert -40°C to -40°F", () => {
      expect(convertCelsiusToFahrenheit(-40)).toBe(-40);
    });

    it("should convert typical vaporizer temperature 180°C", () => {
      expect(convertCelsiusToFahrenheit(180)).toBe(356);
    });

    it("should convert typical vaporizer temperature 220°C", () => {
      expect(convertCelsiusToFahrenheit(220)).toBe(428);
    });

    it("should round correctly", () => {
      expect(convertCelsiusToFahrenheit(37)).toBe(99); // 98.6 -> 99
    });
  });

  describe("convertFahrenheitToCelsius", () => {
    it("should convert 32°F to 0°C", () => {
      expect(convertFahrenheitToCelsius(32)).toBe(0);
    });

    it("should convert 212°F to 100°C", () => {
      expect(convertFahrenheitToCelsius(212)).toBe(100);
    });

    it("should convert -40°F to -40°C", () => {
      expect(convertFahrenheitToCelsius(-40)).toBe(-40);
    });

    it("should convert typical vaporizer temperature 356°F", () => {
      expect(convertFahrenheitToCelsius(356)).toBe(180);
    });

    it("should convert typical vaporizer temperature 428°F", () => {
      expect(convertFahrenheitToCelsius(428)).toBe(220);
    });

    it("should round correctly", () => {
      expect(convertFahrenheitToCelsius(99)).toBe(37); // 37.2 -> 37
    });
  });

  describe("convertToUInt8BLE", () => {
    it("should convert 0 to 1-byte buffer", () => {
      const buffer = convertToUInt8BLE(0);
      expect(buffer.byteLength).toBe(1);
      const dataView = new DataView(buffer);
      expect(dataView.getUint8(0)).toBe(0);
    });

    it("should convert 255 to 1-byte buffer", () => {
      const buffer = convertToUInt8BLE(255);
      expect(buffer.byteLength).toBe(1);
      const dataView = new DataView(buffer);
      expect(dataView.getUint8(0)).toBe(255);
    });

    it("should handle overflow by taking modulo 256", () => {
      const buffer = convertToUInt8BLE(256);
      expect(buffer.byteLength).toBe(1);
      const dataView = new DataView(buffer);
      expect(dataView.getUint8(0)).toBe(0);
    });

    it("should handle overflow for 300", () => {
      const buffer = convertToUInt8BLE(300);
      const dataView = new DataView(buffer);
      expect(dataView.getUint8(0)).toBe(44); // 300 % 256
    });
  });

  describe("convertToUInt16BLE", () => {
    it("should convert 0 to little-endian 2-byte buffer", () => {
      const buffer = convertToUInt16BLE(0);
      expect(buffer.byteLength).toBe(2);
      const dataView = new DataView(buffer);
      expect(dataView.getUint16(0, true)).toBe(0);
    });

    it("should convert 1000 to little-endian 2-byte buffer", () => {
      const buffer = convertToUInt16BLE(1000);
      expect(buffer.byteLength).toBe(2);
      const dataView = new DataView(buffer);
      expect(dataView.getUint16(0, true)).toBe(1000);
    });

    it("should convert max Uint16 value (65535)", () => {
      const buffer = convertToUInt16BLE(65535);
      const dataView = new DataView(buffer);
      expect(dataView.getUint16(0, true)).toBe(65535);
    });

    it("should verify little-endian byte order", () => {
      const buffer = convertToUInt16BLE(256); // 0x0100
      const uint8Array = new Uint8Array(buffer);
      expect(uint8Array[0]).toBe(0); // Low byte first (little-endian)
      expect(uint8Array[1]).toBe(1); // High byte second
    });
  });

  describe("convertToUInt32BLE", () => {
    it("should convert 0 to little-endian 4-byte buffer", () => {
      const buffer = convertToUInt32BLE(0);
      expect(buffer.byteLength).toBe(4);
      const dataView = new DataView(buffer);
      expect(dataView.getUint32(0, true)).toBe(0);
    });

    it("should convert 1000 to little-endian 4-byte buffer", () => {
      const buffer = convertToUInt32BLE(1000);
      expect(buffer.byteLength).toBe(4);
      const dataView = new DataView(buffer);
      expect(dataView.getUint32(0, true)).toBe(1000);
    });

    it("should convert large value correctly", () => {
      const buffer = convertToUInt32BLE(1234567);
      const dataView = new DataView(buffer);
      expect(dataView.getUint32(0, true)).toBe(1234567);
    });

    it("should verify little-endian byte order", () => {
      const buffer = convertToUInt32BLE(16777216); // 0x01000000
      const uint8Array = new Uint8Array(buffer);
      expect(uint8Array[0]).toBe(0); // Low byte first (little-endian)
      expect(uint8Array[1]).toBe(0);
      expect(uint8Array[2]).toBe(0);
      expect(uint8Array[3]).toBe(1); // High byte last
    });

    it("should handle temperature values (e.g., 1800 for 180.0°C)", () => {
      const buffer = convertToUInt32BLE(1800);
      const dataView = new DataView(buffer);
      expect(dataView.getUint32(0, true)).toBe(1800);
    });
  });

  describe("round-trip conversions", () => {
    it("should correctly round-trip Celsius to Fahrenheit and back", () => {
      const temperatures = [0, 100, 180, 200, 220, -40];
      temperatures.forEach((celsius) => {
        const fahrenheit = convertCelsiusToFahrenheit(celsius);
        const backToCelsius = convertFahrenheitToCelsius(fahrenheit);
        expect(backToCelsius).toBe(celsius);
      });
    });

    it("should correctly round-trip Uint16 conversions", () => {
      const values = [0, 100, 1000, 5000, 65535];
      values.forEach((value) => {
        const buffer = convertToUInt16BLE(value);
        const dataView = new DataView(buffer);
        const converted = convertBLEToUint16(dataView);
        expect(converted).toBe(value);
      });
    });
  });
});
