import {
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  Show,
} from "solid-js";
import { m } from "../paraglide/messages";
import {
  LIVE_WINDOW_MS,
  useLiveSamples,
} from "../provider/LiveSessionProvider";
import { formatDuration } from "../utils/heatProgress";
import { Card } from "./ui/card";

interface TemperatureChartProps {
  /** Target in °C, drawn as a dashed reference line */
  target: number;
  /** Converts °C into the unit shown */
  toDisplay: (celsius: number) => number;
  unit: "C" | "F";
}

// Plot area in viewBox units; the SVG stretches horizontally
const WIDTH = 320;
const HEIGHT = 96;
const PAD_Y = 8;
const MIN_WINDOW_MS = 60_000;

/** Live temperature curve of the last minutes with a hover readout */
export const TemperatureChart = (props: TemperatureChartProps) => {
  const samples = useLiveSamples();
  const [now, setNow] = createSignal(Date.now());
  const timer = setInterval(() => setNow(Date.now()), 2_000);
  onCleanup(() => clearInterval(timer));
  const [hoverIndex, setHoverIndex] = createSignal<number>();
  const fillId = createUniqueId();

  const range = createMemo(() => {
    const temps = [...samples().map((s) => s.temp), props.target];
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    // At least 20° of range, so small wobbles don't look dramatic
    const pad = Math.max(5, (20 - (max - min)) / 2);
    return { min: min - pad, max: max + pad };
  });

  // The window grows with the recording, from 1 minute up to the maximum
  const windowMs = () => {
    const first = samples()[0];
    const span = first ? now() - first.time : 0;
    return Math.min(LIVE_WINDOW_MS, Math.max(MIN_WINDOW_MS, span));
  };
  const windowMinutes = () => Math.ceil(windowMs() / 60_000);

  const x = (time: number) => WIDTH - ((now() - time) / windowMs()) * WIDTH;
  const y = (temp: number) => {
    const { min, max } = range();
    return PAD_Y + (1 - (temp - min) / (max - min)) * (HEIGHT - 2 * PAD_Y);
  };

  // The last value still holds until the next one arrives
  const plotted = () => {
    const points = samples();
    const last = points[points.length - 1];
    return last ? [...points, { time: now(), temp: last.temp }] : points;
  };

  const linePath = () =>
    plotted()
      .map(
        (s, i) =>
          `${i === 0 ? "M" : "L"}${x(s.time).toFixed(1)},${y(s.temp).toFixed(1)}`
      )
      .join(" ");

  const areaPath = () => {
    const points = plotted();
    if (points.length < 2) return "";
    const first = x(points[0].time).toFixed(1);
    const last = x(points[points.length - 1].time).toFixed(1);
    return `${linePath()} L${last},${HEIGHT} L${first},${HEIGHT} Z`;
  };

  const hovered = () => {
    const index = hoverIndex();
    return index === undefined ? undefined : samples()[index];
  };

  const handlePointer = (event: PointerEvent) => {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const time =
      now() - (1 - (event.clientX - rect.left) / rect.width) * windowMs();
    let nearest = 0;
    samples().forEach((s, i) => {
      if (Math.abs(s.time - time) < Math.abs(samples()[nearest].time - time)) {
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  const latest = () => samples()[samples().length - 1];

  return (
    <Show when={samples().length >= 2}>
      <Card class="flex flex-col gap-3 p-4">
        <div class="flex items-baseline justify-between gap-3">
          <h2 class="font-medium text-sm">{m.chart_title()}</h2>
          <span class="text-muted-foreground text-xs tabular-nums">
            <Show
              when={hovered()}
              fallback={m.chart_window({ minutes: windowMinutes() })}
            >
              {(sample) => (
                <>
                  <span class="font-semibold text-foreground">
                    {props.toDisplay(sample().temp)} °{props.unit}
                  </span>{" "}
                  ·{" "}
                  {now() - sample().time < 3_000
                    ? m.chart_now()
                    : m.chart_ago({
                        time: formatDuration(
                          Math.round((now() - sample().time) / 1000)
                        ),
                      })}
                </>
              )}
            </Show>
          </span>
        </div>

        <div class="relative">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            class="h-24 w-full touch-pan-y overflow-visible"
            role="img"
            aria-label={`${m.chart_title()}: ${latest() ? props.toDisplay(latest().temp) : ""} °${props.unit}`}
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setHoverIndex(undefined)}
          >
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0"
                  stop-color="var(--primary)"
                  stop-opacity="0.22"
                />
                <stop offset="1" stop-color="var(--primary)" stop-opacity="0" />
              </linearGradient>
            </defs>
            <line
              x1="0"
              x2={WIDTH}
              y1={y(props.target)}
              y2={y(props.target)}
              stroke="var(--muted-foreground)"
              stroke-opacity="0.6"
              stroke-dasharray="4 4"
              vector-effect="non-scaling-stroke"
            />
            <path d={areaPath()} fill={`url(#${fillId})`} />
            <path
              d={linePath()}
              fill="none"
              stroke="var(--primary)"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
            <Show when={hovered()}>
              {(sample) => (
                <line
                  x1={x(sample().time)}
                  x2={x(sample().time)}
                  y1="0"
                  y2={HEIGHT}
                  stroke="var(--foreground)"
                  stroke-opacity="0.35"
                  vector-effect="non-scaling-stroke"
                />
              )}
            </Show>
          </svg>
          {/* Dots are HTML so they stay round on the stretched SVG */}
          <Show when={hovered() ?? latest()}>
            {(sample) => (
              <span
                class="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
                style={{
                  left: `${(x(sample().time) / WIDTH) * 100}%`,
                  top: `${(y(sample().temp) / HEIGHT) * 100}%`,
                }}
              />
            )}
          </Show>
          <span
            class="pointer-events-none absolute right-0 -translate-y-full pb-0.5 text-[10px] text-muted-foreground"
            style={{ top: `${(y(props.target) / HEIGHT) * 100}%` }}
          >
            {m.chart_target()} {props.toDisplay(props.target)}°
          </span>
        </div>

        <div class="flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>−{windowMinutes()} min</span>
          <span>{m.chart_now()}</span>
        </div>
      </Card>
    </Show>
  );
};
