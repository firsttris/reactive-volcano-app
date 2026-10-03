import { describe, expect, it } from "vitest";
import {
  analyzeVentyVeazy,
  Command,
  encodeBoostTemperature,
  encodeBoostTimeoutDisabled,
  encodeBoostVisualization,
  encodeBrightness,
  encodeFactoryReset,
  encodeFindMyDevice,
  encodeHeaterMode,
  encodeIsCelsius,
  encodePermanentBluetooth,
  encodeReadBrightnessVibration,
  encodeRequest,
  encodeSettingsBit,
  encodeSuperBoostTemperature,
  encodeTargetTemperature,
  encodeVibration,
  parseResponse,
  SettingsBit,
  toDisplayOffset,
  toDisplayTemperature,
} from "./protocol";

/** Builds a notification frame from index → byte pairs */
const frame = (bytes: Record<number, number>, size = 20) => {
  const view = new DataView(new ArrayBuffer(size));
  for (const [index, byte] of Object.entries(bytes)) {
    view.setUint8(Number(index), byte);
  }
  return view;
};

const ascii = (text: string, offset: number) =>
  Object.fromEntries(
    [...text].map((char, i) => [offset + i, char.charCodeAt(0)])
  );

const bytes = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)];

/** Expected frame: zeros except for the given index → byte pairs */
const expected = (values: Record<number, number>, size = 20) =>
  bytes(frame(values, size).buffer);

describe("Venty/Veazy protocol", () => {
  describe("parseResponse STATUS (0x01)", () => {
    const statusFrame = frame({
      0: Command.STATUS,
      2: 0x6e, // current 190.2 °C = 1902 = 0x076E
      3: 0x07,
      4: 0x3a, // target 185.0 °C = 1850 = 0x073A
      5: 0x07,
      6: 10, // boost
      7: 15, // superboost
      8: 80, // battery
      9: 60,
      10: 0,
      11: 2, // boost mode
      13: 1, // charging
      14:
        SettingsBit.SETPOINT_REACHED |
        SettingsBit.CHARGE_VOLTAGE_LIMIT |
        SettingsBit.BOOST_VISUALIZATION,
      16: 1, // permanent bluetooth
    });

    it("parses all fields of a Venty status frame", () => {
      const response = parseResponse(statusFrame, "VENTY");
      expect(response).toEqual({
        command: Command.STATUS,
        data: {
          currentTemp: 190,
          targetTemp: 185,
          boostTemp: 10,
          superBoostTemp: 15,
          batteryLevel: 80,
          autoShutdownTimer: 60,
          heaterMode: 2,
          isCharging: true,
          isCelsius: true,
          setpointReached: true,
          chargeCurrentOptimization: false,
          chargeVoltageLimit: true,
          boostVisualization: true,
          buttonChanged: false,
          permanentBluetooth: true,
        },
      });
    });

    it("inverts boost visualization for the Veazy", () => {
      const response = parseResponse(statusFrame, "VEAZY");
      expect(
        response?.command === Command.STATUS && response.data.boostVisualization
      ).toBe(false);
    });

    it("reads Fahrenheit from settings bit 0", () => {
      const response = parseResponse(
        frame({ 0: Command.STATUS, 14: SettingsBit.UNIT_FAHRENHEIT }),
        "VENTY"
      );
      expect(
        response?.command === Command.STATUS && response.data.isCelsius
      ).toBe(false);
    });

    it("ignores frames that are too short", () => {
      expect(parseResponse(frame({ 0: Command.STATUS }, 10), "VENTY")).toBe(
        null
      );
    });
  });

  it("parses FIRMWARE (0x02) versions as ASCII", () => {
    const response = parseResponse(
      frame({
        0: Command.FIRMWARE,
        1: 0x01,
        ...ascii("VY0109", 2),
        ...ascii("BL0102", 11),
      }),
      "VENTY"
    );
    expect(response).toEqual({
      command: Command.FIRMWARE,
      data: {
        flags: 1,
        isApplicationMode: true,
        firmwareVersion: "VY0109",
        bootloaderVersion: "BL0102",
      },
    });
  });

  it("parses EXTENDED_DATA (0x04) as uint24 minutes", () => {
    const response = parseResponse(
      frame({ 0: Command.EXTENDED_DATA, 1: 0x10, 2: 0x27, 4: 0x3c }),
      "VENTY"
    );
    expect(response).toEqual({
      command: Command.EXTENDED_DATA,
      data: { heaterRuntimeMinutes: 10000, batteryChargingTimeMinutes: 60 },
    });
  });

  it("parses DEVICE_DATA (0x05) serial number and color", () => {
    const response = parseResponse(
      frame({
        0: Command.DEVICE_DATA,
        ...ascii("123456", 9),
        ...ascii("VZ", 15),
        18: 3,
      }),
      "VEAZY"
    );
    expect(response).toEqual({
      command: Command.DEVICE_DATA,
      data: { serialNumber: "VZ123456", colorIndex: 3 },
    });
  });

  it("parses BRIGHTNESS_VIBRATION (0x06)", () => {
    const response = parseResponse(
      frame({ 0: Command.BRIGHTNESS_VIBRATION, 2: 7, 5: 1, 6: 0 }, 7),
      "VENTY"
    );
    expect(response).toEqual({
      command: Command.BRIGHTNESS_VIBRATION,
      data: { brightness: 7, vibration: true, boostTimeoutDisabled: false },
    });
  });

  it("parses ADVERTISING_INFO (0x1D) find-my flag", () => {
    const response = parseResponse(
      frame({ 0: Command.ADVERTISING_INFO, 1: 0x10 }),
      "VENTY"
    );
    expect(response).toEqual({
      command: Command.ADVERTISING_INFO,
      data: { findMyDeviceActive: true },
    });
  });

  it("parses ANALYSIS (0x03) error code and category", () => {
    const response = parseResponse(
      frame({ 0: Command.ANALYSIS, 1: 0x12, 2: 4 }),
      "VENTY"
    );
    expect(response).toEqual({
      command: Command.ANALYSIS,
      data: { errorCode: 0x12, errorCategory: 4 },
    });
  });

  it("returns null for unknown commands", () => {
    expect(parseResponse(frame({ 0: 0x29 }), "VENTY")).toBe(null);
  });

  // Expected byte layouts are taken from qvap.js
  describe("encoders", () => {
    it("encodes plain requests as 20-byte frames", () => {
      expect(bytes(encodeRequest(Command.STATUS))).toEqual(
        expected({ 0: 0x01 })
      );
      expect(bytes(encodeReadBrightnessVibration())).toEqual(
        expected({ 0: 0x06 }, 7)
      );
    });

    it("encodes the target temperature as uint16 LE × 10", () => {
      expect(bytes(encodeTargetTemperature(185))).toEqual(
        expected({ 0: 1, 1: 1 << 1, 4: 0x3a, 5: 0x07 })
      );
    });

    it("clamps the target temperature to 40-210 °C", () => {
      expect(bytes(encodeTargetTemperature(230))).toEqual(
        bytes(encodeTargetTemperature(210))
      );
      expect(bytes(encodeTargetTemperature(10))).toEqual(
        bytes(encodeTargetTemperature(40))
      );
    });

    it("encodes boost and superboost offsets", () => {
      expect(bytes(encodeBoostTemperature(12))).toEqual(
        expected({ 0: 1, 1: 1 << 2, 6: 12 })
      );
      expect(bytes(encodeSuperBoostTemperature(20))).toEqual(
        expected({ 0: 1, 1: 1 << 3, 7: 20 })
      );
      expect(bytes(encodeBoostTemperature(0))).toEqual(
        bytes(encodeBoostTemperature(1))
      );
    });

    it("encodes the heater mode", () => {
      expect(bytes(encodeHeaterMode(1))).toEqual(
        expected({ 0: 1, 1: 1 << 5, 11: 1 })
      );
    });

    it("encodes settings bits with value in byte 14 and mask in byte 15", () => {
      expect(
        bytes(encodeSettingsBit(SettingsBit.CHARGE_CURRENT_OPTIMIZATION, true))
      ).toEqual(expected({ 0: 1, 1: 1 << 7, 14: 8, 15: 8 }));
      expect(
        bytes(encodeSettingsBit(SettingsBit.CHARGE_CURRENT_OPTIMIZATION, false))
      ).toEqual(expected({ 0: 1, 1: 1 << 7, 15: 8 }));
      expect(bytes(encodeIsCelsius(false))).toEqual(
        expected({ 0: 1, 1: 1 << 7, 14: 1, 15: 1 })
      );
      expect(bytes(encodeFactoryReset())).toEqual(
        expected({ 0: 1, 1: 1 << 7, 14: 4, 15: 4 })
      );
    });

    it("inverts boost visualization for the Veazy", () => {
      expect(bytes(encodeBoostVisualization(true, "VENTY"))).toEqual(
        expected({ 0: 1, 1: 1 << 7, 14: 0x40, 15: 0x40 })
      );
      expect(bytes(encodeBoostVisualization(true, "VEAZY"))).toEqual(
        expected({ 0: 1, 1: 1 << 7, 15: 0x40 })
      );
    });

    it("encodes permanent bluetooth in bytes 16/17", () => {
      expect(bytes(encodePermanentBluetooth(true))).toEqual(
        expected({ 0: 1, 1: 1 << 7, 16: 1, 17: 1 })
      );
    });

    it("encodes brightness, vibration and boost timeout as 7-byte frames", () => {
      expect(bytes(encodeBrightness(12))).toEqual(
        expected({ 0: 6, 1: 1, 2: 9 }, 7)
      );
      expect(bytes(encodeVibration(true))).toEqual(
        expected({ 0: 6, 1: 1 << 3, 5: 1 }, 7)
      );
      expect(bytes(encodeBoostTimeoutDisabled(true))).toEqual(
        expected({ 0: 6, 1: 1 << 4, 6: 1 }, 7)
      );
    });

    it("encodes find my device", () => {
      expect(bytes(encodeFindMyDevice())).toEqual(expected({ 0: 0x0d, 1: 1 }));
    });
  });

  it("converts temperatures and offsets for display", () => {
    expect(toDisplayTemperature(185, true)).toBe(185);
    expect(toDisplayTemperature(185, false)).toBe(365);
    expect(toDisplayOffset(10, false)).toBe(18);
  });
});

describe("Venty/Veazy analysis", () => {
  const status = parseResponse(
    frame({ 0: Command.STATUS, 14: SettingsBit.BOOST_VISUALIZATION }),
    "VENTY"
  );
  const input = {
    analysis: { errorCode: 0, errorCategory: 0 },
    status: status?.command === Command.STATUS ? status.data : null,
    brightnessVibration: {
      brightness: 9,
      vibration: true,
      boostTimeoutDisabled: false,
    },
    serialNumber: "VY123456",
    now: new Date(0x65000000 * 1000),
  };

  it("reports no findings with default settings", () => {
    expect(analyzeVentyVeazy(input)).toEqual({
      errorReport: null,
      findings: [],
    });
  });

  it("reports an issue with a support report for category 4", () => {
    const result = analyzeVentyVeazy({
      ...input,
      analysis: { errorCode: 0x12, errorCategory: 4 },
    });
    expect(result.findings).toEqual(["analysis_finding_issueDetected"]);
    expect(result.errorReport).toBe(
      [
        "SN   :   VY123456",
        "date : 0x65000000",
        "code : 0x12",
        "cat  : 0x04",
      ].join("\n")
    );
  });

  it("lists settings that differ from the defaults", () => {
    const changed = parseResponse(
      frame({
        0: Command.STATUS,
        14:
          SettingsBit.CHARGE_VOLTAGE_LIMIT |
          SettingsBit.CHARGE_CURRENT_OPTIMIZATION,
      }),
      "VENTY"
    );
    const result = analyzeVentyVeazy({
      ...input,
      status: changed?.command === Command.STATUS ? changed.data : null,
      brightnessVibration: {
        brightness: 5,
        vibration: false,
        boostTimeoutDisabled: true,
      },
    });
    expect(result.findings).toEqual([
      "analysis_finding_lowBrightness",
      "analysis_finding_chargeLimit",
      "analysis_finding_boostVisualizationDisabled",
      "analysis_finding_boostTimeoutDisabled",
      "analysis_finding_chargeOptimization",
      "analysis_finding_vibrationDisabled",
    ]);
  });
});
