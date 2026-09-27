import { describe, it, expect } from "vitest";
import {
  encodeBoostTemperature,
  encodeHeaterCommand,
  encodeTargetTemperature,
  isHeaterActive,
  isOldFirmware,
  isSetpointReached,
  parseBleFirmwareVersion,
  parseTargetTemperature,
  parseTemperature,
  parseText,
  parseUint16,
} from "./protocol";

const view = (...bytes: number[]) => new DataView(new Uint8Array(bytes).buffer);
const bytes = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)];

describe("Crafty protocol", () => {
  it("parses uint16 little endian values", () => {
    expect(parseUint16(view(0x39, 0x05))).toBe(1337);
    expect(parseUint16(view(42))).toBe(42);
    expect(parseUint16(view())).toBe(0);
  });

  it("parses temperatures in 1/10 °C", () => {
    expect(parseTemperature(view(0x3a, 0x07))).toBe(185);
  });

  it("converts a target temperature reported in °F", () => {
    // 365 °F = 3650 = 0x0E42
    expect(parseTargetTemperature(view(0x42, 0x0e))).toBe(185);
    expect(parseTargetTemperature(view(0x34, 0x08))).toBe(210);
  });

  it("parses text without trailing null bytes", () => {
    expect(parseText(view(0x56, 0x30, 0x32, 0x2e, 0x35, 0x31, 0, 0))).toBe(
      "V02.51"
    );
  });

  it("parses the 3-byte BLE firmware version", () => {
    expect(parseBleFirmwareVersion(view(1, 2, 3))).toBe("V1.2.3");
  });

  it("detects old firmware like the legacy app", () => {
    expect(isOldFirmware("V02.40")).toBe(true);
    expect(isOldFirmware("V2.48")).toBe(true);
    expect(isOldFirmware("V02.51")).toBe(false);
    expect(isOldFirmware("V03.01")).toBe(false);
    expect(isOldFirmware("")).toBe(false);
  });

  it("reads heater and setpoint bits", () => {
    expect(isHeaterActive(0x10)).toBe(true);
    expect(isHeaterActive(0x20)).toBe(false);
    expect(isSetpointReached(0x04)).toBe(true);
    expect(isSetpointReached(0x1000)).toBe(false);
  });

  it("encodes temperatures as uint16 × 10 with clamping", () => {
    expect(bytes(encodeTargetTemperature(185))).toEqual([0x3a, 0x07]);
    expect(bytes(encodeTargetTemperature(250))).toEqual(
      bytes(encodeTargetTemperature(210))
    );
    expect(bytes(encodeBoostTemperature(15))).toEqual([150, 0]);
    expect(bytes(encodeBoostTemperature(99))).toEqual([44, 1]);
  });

  it("encodes heater commands as a 2-byte zero value", () => {
    expect(bytes(encodeHeaterCommand())).toEqual([0, 0]);
  });
});
