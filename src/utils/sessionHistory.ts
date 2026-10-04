/** One reading of a connected device, temperatures in °C */
export interface SessionReading {
  time: number;
  temp: number;
  target: number;
  heating: boolean;
  reached: boolean;
  pumping: boolean;
}

/** A session that is still being recorded */
export interface ActiveSession {
  startedAt: number;
  maxTarget: number;
  peakTemp: number;
  reachedAt: number | null;
  pumpCycles: number;
  wasPumping: boolean;
  lastSampleAt: number;
  /** [time in ms, °C] */
  samples: [number, number][];
}

/** A finished heater session as it is stored */
export interface Session {
  id: string;
  device: string;
  startedAt: number;
  durationSeconds: number;
  maxTarget: number;
  peakTemp: number;
  /** Seconds from heater on until the target was first reached */
  heatUpSeconds: number | null;
  pumpCycles: number;
  /** [seconds since start, °C] */
  samples: [number, number][];
}

export const SAMPLE_INTERVAL_MS = 5_000;
// Shorter sessions are mostly accidental taps on the heater
export const MIN_SESSION_SECONDS = 30;
export const MAX_STORED_SESSIONS = 300;
export const MAX_SESSION_POINTS = 120;

const DAY_MS = 24 * 60 * 60 * 1000;

export const startSession = (reading: SessionReading): ActiveSession => ({
  startedAt: reading.time,
  maxTarget: reading.target,
  peakTemp: reading.temp,
  reachedAt: reading.reached ? reading.time : null,
  pumpCycles: reading.pumping ? 1 : 0,
  wasPumping: reading.pumping,
  lastSampleAt: reading.time,
  samples: [[reading.time, reading.temp]],
});

export const updateSession = (
  session: ActiveSession,
  reading: SessionReading
): ActiveSession => {
  const takeSample = reading.time - session.lastSampleAt >= SAMPLE_INTERVAL_MS;
  return {
    ...session,
    maxTarget: Math.max(session.maxTarget, reading.target),
    peakTemp: Math.max(session.peakTemp, reading.temp),
    reachedAt:
      session.reachedAt ?? (reading.reached ? reading.time : session.reachedAt),
    pumpCycles:
      session.pumpCycles + (reading.pumping && !session.wasPumping ? 1 : 0),
    wasPumping: reading.pumping,
    lastSampleAt: takeSample ? reading.time : session.lastSampleAt,
    samples: takeSample
      ? [...session.samples, [reading.time, reading.temp]]
      : session.samples,
  };
};

/** Keeps every n-th point so that at most `max` remain, always with the last */
export const downsample = <T>(points: T[], max: number): T[] => {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from(
    { length: max },
    (_, index) => points[Math.round(index * step)]
  );
};

/** The stored session, or null if it was too short to keep */
export const finishSession = (
  session: ActiveSession,
  device: string,
  endedAt: number,
  id: string
): Session | null => {
  const durationSeconds = Math.round((endedAt - session.startedAt) / 1000);
  if (durationSeconds < MIN_SESSION_SECONDS) return null;
  return {
    id,
    device,
    startedAt: session.startedAt,
    durationSeconds,
    maxTarget: session.maxTarget,
    peakTemp: session.peakTemp,
    heatUpSeconds:
      session.reachedAt === null
        ? null
        : Math.round((session.reachedAt - session.startedAt) / 1000),
    pumpCycles: session.pumpCycles,
    samples: downsample(session.samples, MAX_SESSION_POINTS).map(
      ([time, temp]) => [Math.round((time - session.startedAt) / 1000), temp]
    ),
  };
};

export interface HistorySummary {
  sessionsLastWeek: number;
  secondsLastWeek: number;
  averageHeatUpSeconds: number | null;
}

export const summarize = (sessions: Session[], now: number): HistorySummary => {
  const lastWeek = sessions.filter((s) => now - s.startedAt < 7 * DAY_MS);
  const heatUps = lastWeek
    .map((s) => s.heatUpSeconds)
    .filter((seconds): seconds is number => seconds !== null);
  return {
    sessionsLastWeek: lastWeek.length,
    secondsLastWeek: lastWeek.reduce((sum, s) => sum + s.durationSeconds, 0),
    averageHeatUpSeconds:
      heatUps.length === 0
        ? null
        : Math.round(heatUps.reduce((sum, s) => sum + s, 0) / heatUps.length),
  };
};

/** Newest first, capped so storage stays small */
export const addSession = (sessions: Session[], session: Session) =>
  [session, ...sessions].slice(0, MAX_STORED_SESSIONS);

const csvField = (value: string | number | null) => {
  const text = value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const sessionsToCsv = (sessions: Session[]) =>
  [
    [
      "start",
      "device",
      "duration_s",
      "target_c",
      "peak_c",
      "heat_up_s",
      "pump_cycles",
    ],
    ...sessions.map((s) => [
      new Date(s.startedAt).toISOString(),
      s.device,
      s.durationSeconds,
      s.maxTarget,
      s.peakTemp,
      s.heatUpSeconds,
      s.pumpCycles,
    ]),
  ]
    .map((row) => row.map(csvField).join(","))
    .join("\n");
