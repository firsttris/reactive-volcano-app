import { describe, expect, it } from "vitest";
import {
  addSession,
  downsample,
  finishSession,
  MAX_STORED_SESSIONS,
  type Session,
  type SessionReading,
  sanitizeSession,
  sessionsToCsv,
  startSession,
  summarize,
  updateSession,
} from "./sessionHistory";

const reading = (overrides: Partial<SessionReading>): SessionReading => ({
  time: 0,
  temp: 40,
  target: 185,
  heating: true,
  reached: false,
  pumping: false,
  ...overrides,
});

const session = (overrides: Partial<Session>): Session => ({
  id: "s",
  device: "Volcano Hybrid",
  startedAt: 0,
  durationSeconds: 600,
  maxTarget: 185,
  peakTemp: 186,
  heatUpSeconds: 120,
  pumpCycles: 0,
  samples: [],
  ...overrides,
});

describe("sessionHistory", () => {
  it("tracks peak, heat-up time and pump cycles", () => {
    let active = startSession(reading({ time: 0, temp: 60 }));
    active = updateSession(active, reading({ time: 5_000, temp: 120 }));
    active = updateSession(
      active,
      reading({ time: 90_000, temp: 184, reached: true })
    );
    active = updateSession(
      active,
      reading({ time: 95_000, temp: 186, reached: true, pumping: true })
    );
    active = updateSession(
      active,
      reading({ time: 100_000, temp: 185, reached: true, pumping: false })
    );
    active = updateSession(
      active,
      reading({ time: 105_000, temp: 185, reached: true, pumping: true })
    );

    const finished = finishSession(active, "Volcano Hybrid", 120_000, "id");
    expect(finished).toMatchObject({
      durationSeconds: 120,
      peakTemp: 186,
      heatUpSeconds: 90,
      pumpCycles: 2,
    });
    expect(finished?.samples[0]).toEqual([0, 60]);
  });

  it("samples at most every few seconds", () => {
    let active = startSession(reading({ time: 0 }));
    active = updateSession(active, reading({ time: 1_000, temp: 50 }));
    active = updateSession(active, reading({ time: 5_000, temp: 60 }));
    expect(active.samples).toEqual([
      [0, 40],
      [5_000, 60],
    ]);
  });

  it("drops sessions that are too short", () => {
    const active = startSession(reading({ time: 0 }));
    expect(finishSession(active, "Venty", 10_000, "id")).toBeNull();
  });

  it("has no heat-up time if the target was never reached", () => {
    const active = startSession(reading({ time: 0 }));
    expect(finishSession(active, "Venty", 60_000, "id")?.heatUpSeconds).toBe(
      null
    );
  });

  it("downsamples to the limit and keeps the last point", () => {
    const points = Array.from({ length: 1000 }, (_, i) => i);
    const result = downsample(points, 10);
    expect(result).toHaveLength(10);
    expect(result[0]).toBe(0);
    expect(result[9]).toBe(999);
  });

  it("summarizes the last week", () => {
    const now = 30 * 24 * 60 * 60 * 1000;
    const summary = summarize(
      [
        session({ startedAt: now - 1000, durationSeconds: 300 }),
        session({ startedAt: now - 2000, heatUpSeconds: 60 }),
        session({ startedAt: 0, heatUpSeconds: null }),
      ],
      now
    );
    expect(summary).toEqual({
      sessionsLastWeek: 2,
      secondsLastWeek: 900,
      averageHeatUpSeconds: 90,
    });
  });

  it("keeps the newest sessions first and caps the list", () => {
    const many = Array.from({ length: MAX_STORED_SESSIONS }, (_, i) =>
      session({ id: String(i) })
    );
    const result = addSession(many, session({ id: "new" }));
    expect(result).toHaveLength(MAX_STORED_SESSIONS);
    expect(result[0].id).toBe("new");
  });

  it("exports CSV with escaped fields", () => {
    const csv = sessionsToCsv([
      session({ device: 'Crafty "plus"', heatUpSeconds: null }),
    ]);
    expect(csv.split("\n")[1]).toBe(
      '1970-01-01T00:00:00.000Z,"Crafty ""plus""",600,185,186,,0'
    );
  });

  it("records sessions without a measured temperature", () => {
    let active = startSession(reading({ time: 0, temp: null }));
    active = updateSession(
      active,
      reading({ time: 60_000, temp: null, reached: true })
    );
    const finished = finishSession(active, "Venty", 120_000, "id");
    expect(finished).toMatchObject({
      peakTemp: null,
      heatUpSeconds: 60,
      samples: [],
    });
  });

  it("ignores the device's unknown marker", () => {
    let active = startSession(reading({ time: 0, temp: 3277 }));
    active = updateSession(active, reading({ time: 5_000, temp: 3277 }));
    expect(active.peakTemp).toBeNull();
    expect(active.samples).toEqual([]);
  });

  it("cleans sessions stored with the unknown marker", () => {
    const cleaned = sanitizeSession(
      session({
        peakTemp: 3277,
        samples: [
          [0, 3277],
          [5, 3277],
        ],
      })
    );
    expect(cleaned.peakTemp).toBeNull();
    expect(cleaned.samples).toEqual([]);
  });
});
