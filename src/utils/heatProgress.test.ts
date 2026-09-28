import { describe, expect, it } from "vitest";
import {
  estimateSecondsRemaining,
  formatDuration,
  getHeatProgress,
  getHeatStatus,
} from "./heatProgress";

describe("heatProgress", () => {
  describe("getHeatStatus", () => {
    it("is off while the heater is off", () => {
      expect(getHeatStatus(20, 180, false)).toBe("off");
    });

    it("is heating below the target", () => {
      expect(getHeatStatus(150, 180, true)).toBe("heating");
    });

    it("counts small deviations as reached", () => {
      expect(getHeatStatus(178, 180, true)).toBe("reached");
      expect(getHeatStatus(182, 180, true)).toBe("reached");
    });

    it("is cooling well above the target", () => {
      expect(getHeatStatus(200, 180, true)).toBe("cooling");
    });
  });

  describe("getHeatProgress", () => {
    it("measures progress from room temperature by default", () => {
      expect(getHeatProgress(100, 180)).toBe(0.5);
    });

    it("clamps to 0..1", () => {
      expect(getHeatProgress(10, 180, 20)).toBe(0);
      expect(getHeatProgress(200, 180, 20)).toBe(1);
    });

    it("handles a target at or below the base", () => {
      expect(getHeatProgress(180, 180, 180)).toBe(1);
      expect(getHeatProgress(150, 180, 190)).toBe(0);
    });
  });

  describe("estimateSecondsRemaining", () => {
    it("extrapolates the recent heating rate", () => {
      const samples = [
        { time: 0, temp: 100 },
        { time: 5_000, temp: 110 },
      ];
      // 2 °C/s, 70 °C left
      expect(estimateSecondsRemaining(samples, 180, 5_000)).toBe(35);
    });

    it("needs a few seconds of data", () => {
      const samples = [
        { time: 0, temp: 100 },
        { time: 1_000, temp: 102 },
      ];
      expect(estimateSecondsRemaining(samples, 180, 1_000)).toBeNull();
    });

    it("ignores stale samples", () => {
      const samples = [
        { time: 0, temp: 50 },
        { time: 20_000, temp: 100 },
        { time: 21_000, temp: 101 },
      ];
      expect(estimateSecondsRemaining(samples, 180, 21_000)).toBeNull();
    });

    it("returns null when not heating up", () => {
      const samples = [
        { time: 0, temp: 100 },
        { time: 5_000, temp: 100 },
      ];
      expect(estimateSecondsRemaining(samples, 180, 5_000)).toBeNull();
    });
  });

  it("formats durations as m:ss", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(9)).toBe("0:09");
  });
});
