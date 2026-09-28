export type HeatStatus = "off" | "heating" | "cooling" | "reached";

export interface TemperatureSample {
  time: number;
  temp: number;
}

// Devices regulate around the target, so small deviations count as reached
export const REACHED_TOLERANCE = 2;
// Samples older than this are ignored for the heating rate
export const RATE_WINDOW_MS = 15_000;
const MIN_RATE_SPAN_MS = 3_000;
const MIN_RATE_PER_SECOND = 0.05;

export const getHeatStatus = (
  current: number,
  target: number,
  heating: boolean
): HeatStatus => {
  if (!heating) return "off";
  if (current > target + REACHED_TOLERANCE) return "cooling";
  if (current >= target - REACHED_TOLERANCE) return "reached";
  return "heating";
};

// Progress is measured from here, since the temperature at heater start is
// unknown when the app connects to a device that is already heating
export const ROOM_TEMP = 20;

/** Share (0..1) of the way from `base` to `target` that `current` has covered */
export const getHeatProgress = (
  current: number,
  target: number,
  base = ROOM_TEMP
) => {
  if (target <= base) return current >= target ? 1 : 0;
  return Math.min(1, Math.max(0, (current - base) / (target - base)));
};

/** Seconds until `target` at the rate seen in `samples`, or null if unknown */
export const estimateSecondsRemaining = (
  samples: TemperatureSample[],
  target: number,
  now: number
): number | null => {
  const recent = samples.filter((s) => now - s.time <= RATE_WINDOW_MS);
  if (recent.length < 2) return null;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const span = last.time - first.time;
  if (span < MIN_RATE_SPAN_MS) return null;
  const ratePerSecond = (last.temp - first.temp) / (span / 1000);
  if (ratePerSecond < MIN_RATE_PER_SECOND) return null;
  const remaining = target - last.temp;
  if (remaining <= 0) return 0;
  return Math.round(remaining / ratePerSecond);
};

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
};
