import { describe, expect, it } from "vitest";
import {
  analyzeCrafty,
  type CraftyAnalysisInput,
  encodeBoostTemperature,
  encodeHeaterCommand,
  encodeTargetTemperature,
  isCraftyPlus,
  isHeaterActive,
  isOldFirmware,
  isSetpointReached,
  parseBleFirmwareVersion,
  parseSerialNumber,
  parseTargetTemperature,
  parseTemperature,
  parseText,
  parseUint16,
  withBit,
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

  it("detects a Crafty+ by its 3.x firmware", () => {
    expect(isCraftyPlus("V03.01")).toBe(true);
    expect(isCraftyPlus("V02.51")).toBe(false);
    expect(isCraftyPlus("")).toBe(false);
  });

  it("parses the first 8 characters of the serial number", () => {
    const text = [..."CY123456XYZ"].map((c) => c.charCodeAt(0));
    expect(parseSerialNumber(view(...text))).toBe("CY123456");
  });

  it("sets and clears single register bits", () => {
    expect(withBit(0x04, 0x01, true)).toBe(0x05);
    expect(withBit(0x05, 0x01, false)).toBe(0x04);
    expect(withBit(0x05, 0x01, true)).toBe(0x05);
  });
});

describe("Crafty analysis", () => {
  const healthy: CraftyAnalysisInput = {
    projectRegister: 0x10,
    statusRegister2: 0x04,
    akkuStatus: 0,
    akkuStatus2: 0,
    systemStatus: 0,
    ledBrightness: 100,
    serialNumber: "CY123456",
    now: new Date(0x65000000 * 1000),
  };

  it("reports no findings for a healthy device", () => {
    expect(analyzeCrafty(healthy)).toEqual({ errorReport: null, findings: [] });
  });

  it("creates a support report when an error bit is set", () => {
    const result = analyzeCrafty({ ...healthy, systemStatus: 0x0200 });
    expect(result.findings).toEqual([]);
    expect(result.errorReport).toBe(
      [
        "SN   :   CY123456",
        "date : 0x65000000",
        "val_1: 0x0010",
        "val_2: 0x0004",
        "val_3: 0x0000",
        "val_4: 0x0000",
        "val_5: 0x0200",
      ].join("\n")
    );
  });

  it("lists battery hints by priority and changed settings", () => {
    const result = analyzeCrafty({
      ...healthy,
      akkuStatus: 0x4000 | 0x0001,
      statusRegister2: 0x1000 | 0x02 | 0x01,
      projectRegister: 0x8000,
      ledBrightness: 5,
    });
    expect(result.findings).toEqual([
      "analysis_finding_coolDown",
      "analysis_finding_vibrationDisabled",
      "analysis_finding_ledDisabled",
      "analysis_finding_bluetoothAlwaysOn",
      "analysis_finding_factoryResetNeeded",
      "analysis_finding_lowBrightness",
    ]);
  });

  it("asks for another charger when only that bit is set", () => {
    expect(analyzeCrafty({ ...healthy, akkuStatus2: 0x8000 }).findings).toEqual(
      ["analysis_finding_useOtherCharger"]
    );
  });
});
