import { describe, expect, it } from "vitest";
import {
  encodeCommand,
  encodeRegisterBit,
  encodeTargetTemperature,
  hasBit,
  parseCurrentTemperature,
  parseShortText,
  parseTemperature,
  Register2Bit,
  Register3Bit,
} from "./protocol";

const view = (...bytes: number[]) => new DataView(new Uint8Array(bytes).buffer);
const bytes = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)];

describe("Volcano protocol", () => {
  it("parses temperatures in 1/10 °C", () => {
    expect(parseTemperature(view(0xfc, 0x08))).toBe(230);
  });

  it("ignores invalid current temperatures", () => {
    expect(parseCurrentTemperature(view(0xd0, 0x07))).toBe(200);
    expect(parseCurrentTemperature(view(0xff, 0xff))).toBe(null);
  });

  it("reads the first 8 characters of serial and firmware", () => {
    const text = [..."12345678XYZ"].map((c) => c.charCodeAt(0));
    expect(parseShortText(view(...text))).toBe("12345678");
  });

  it("encodes the target temperature as uint32 × 10 with clamping", () => {
    expect(bytes(encodeTargetTemperature(185))).toEqual([0x3a, 0x07, 0, 0]);
    expect(bytes(encodeTargetTemperature(250))).toEqual(
      bytes(encodeTargetTemperature(230))
    );
    expect(bytes(encodeTargetTemperature(20))).toEqual(
      bytes(encodeTargetTemperature(40))
    );
  });

  it("encodes heater and pump commands as a single zero byte", () => {
    expect(bytes(encodeCommand())).toEqual([0]);
  });

  // Same values as volcano.js: MASK clears the bit, 65536 + MASK sets it
  it("encodes register bit changes", () => {
    expect(
      bytes(encodeRegisterBit(Register3Bit.VIBRATION_DISABLED, false))
    ).toEqual([0x00, 0x04, 0x00, 0x00]);
    expect(
      bytes(encodeRegisterBit(Register3Bit.VIBRATION_DISABLED, true))
    ).toEqual([0x00, 0x04, 0x01, 0x00]);
    expect(
      bytes(encodeRegisterBit(Register2Bit.DISPLAY_ON_COOLING_DISABLED, true))
    ).toEqual([0x00, 0x10, 0x01, 0x00]);
  });

  it("checks register bits", () => {
    expect(hasBit(0x2020, 0x2000)).toBe(true);
    expect(hasBit(0x0020, 0x2000)).toBe(false);
  });
});
