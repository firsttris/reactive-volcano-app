import {
  createEffect,
  createSignal,
  createUniqueId,
  type JSX,
  on,
  onCleanup,
  Show,
} from "solid-js";
import { cn } from "../lib/utils";
import { m } from "../paraglide/messages";
import {
  estimateSecondsRemaining,
  formatDuration,
  getHeatProgress,
  getHeatStatus,
  type HeatStatus,
  RATE_WINDOW_MS,
  type TemperatureSample,
} from "../utils/heatProgress";
import { Badge } from "./ui/badge";

interface TemperatureGaugeProps {
  /** Temperatures in °C, they drive the arc and the heating estimate */
  current: number;
  target: number;
  min: number;
  max: number;
  heating: boolean;
  /** Device-reported "setpoint reached", overrides the tolerance check */
  reached?: boolean;
  /** The current temperature as shown, in the device's unit */
  children: JSX.Element;
  /** Scale labels below the arc, in the device's unit */
  minLabel: string;
  maxLabel: string;
}

// Arc geometry: a 270° ring that is open at the bottom
const SIZE = 264;
const CENTER = SIZE / 2;
const RADIUS = 112;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_LENGTH = CIRCUMFERENCE * 0.75;
const START_ANGLE = 135;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const statusBadge: Record<HeatStatus, "secondary" | "success" | "soft"> = {
  off: "secondary",
  reached: "success",
  heating: "soft",
  cooling: "soft",
};

/** Ring gauge with the current temperature, a target marker and heat status */
export const TemperatureGauge = (props: TemperatureGaugeProps) => {
  const gradientId = createUniqueId();
  const [samples, setSamples] = createSignal<TemperatureSample[]>([]);
  const [now, setNow] = createSignal(Date.now());

  const status = (): HeatStatus => {
    const computed = getHeatStatus(props.current, props.target, props.heating);
    return props.reached && computed !== "off" ? "reached" : computed;
  };

  // A new target or heater state makes the old heating rate meaningless
  createEffect(
    on(
      () => [props.heating, props.target] as const,
      () => setSamples([])
    )
  );

  createEffect(
    on(
      () => props.current,
      (temp) => {
        const time = Date.now();
        setNow(time);
        setSamples((prev) => [
          ...prev.filter((s) => time - s.time <= RATE_WINDOW_MS),
          { time, temp },
        ]);
      }
    )
  );

  // A short buzz when the target is reached, where the device supports it
  createEffect(
    on(
      status,
      (next, previous) => {
        if (next === "reached" && previous === "heating") {
          navigator.vibrate?.(200);
        }
      },
      { defer: true }
    )
  );

  // Notifications only arrive on change, so keep the estimate from going stale
  const timer = setInterval(() => setNow(Date.now()), 1000);
  onCleanup(() => clearInterval(timer));

  const eta = () =>
    status() === "heating"
      ? estimateSecondsRemaining(samples(), props.target, now())
      : null;

  const label = () => {
    switch (status()) {
      case "off":
        return m.heat_off();
      case "reached":
        return m.heat_reached();
      case "cooling":
        return m.heat_coolingDown();
      default:
        return m.heat_heatingUp();
    }
  };

  const fraction = (celsius: number) =>
    clamp01((celsius - props.min) / (props.max - props.min));

  const marker = () => {
    const angle =
      ((START_ANGLE + 270 * fraction(props.target)) * Math.PI) / 180;
    return {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    };
  };

  const arcStroke = () => {
    if (status() === "reached") return "var(--success)";
    if (status() === "off") return "var(--muted-foreground)";
    return `url(#${gradientId})`;
  };

  return (
    <section class="flex flex-col items-center">
      <div
        class="relative aspect-[264/250] w-[264px] max-w-full"
        role="progressbar"
        aria-label={label()}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(
          (status() === "off"
            ? 0
            : getHeatProgress(props.current, props.target)) * 100
        )}
      >
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          class="absolute inset-x-0 top-0 w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stop-color="#fbbf24" />
              <stop offset="1" stop-color="var(--primary)" />
            </linearGradient>
          </defs>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--track)"
            stroke-width="12"
            stroke-linecap="round"
            stroke-dasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
            transform={`rotate(${START_ANGLE} ${CENTER} ${CENTER})`}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={arcStroke()}
            stroke-opacity={status() === "off" ? 0.35 : 1}
            stroke-width="12"
            stroke-linecap="round"
            stroke-dasharray={`${ARC_LENGTH * fraction(props.current)} ${CIRCUMFERENCE}`}
            transform={`rotate(${START_ANGLE} ${CENTER} ${CENTER})`}
            class={cn(
              "transition-[stroke-dasharray] duration-700 ease-out",
              status() === "heating" &&
                "drop-shadow-[0_0_10px_var(--glow)] motion-safe:animate-pulse",
              status() === "cooling" && "drop-shadow-[0_0_10px_var(--glow)]",
              status() === "reached" &&
                "drop-shadow-[0_0_10px_var(--success-soft)]"
            )}
          />
          <circle
            cx={marker().x}
            cy={marker().y}
            r="9"
            fill="var(--background)"
            stroke="var(--foreground)"
            stroke-width="3"
            class="transition-[cx,cy] duration-300"
          />
        </svg>
        <div class="absolute inset-x-0 top-[24%] flex flex-col items-center gap-1">
          <span class="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
            {m.temperature_current()}
          </span>
          <span class="font-extralight text-[76px] leading-none tracking-[-0.04em]">
            {props.children}
          </span>
          <Badge variant={statusBadge[status()]} class="mt-1.5 py-1">
            <span
              class={cn(
                "size-1.5 rounded-full bg-current",
                status() === "heating" && "motion-safe:animate-pulse"
              )}
            />
            {label()}
            <Show when={eta()}>
              {(seconds) => (
                <span class="font-normal opacity-80">
                  · {m.heat_remaining()} ~{formatDuration(seconds())}
                </span>
              )}
            </Show>
          </Badge>
        </div>
      </div>
      <div class="-mt-3 flex w-[230px] max-w-full justify-between font-mono text-[11px] text-muted-foreground">
        <span>{props.minLabel}</span>
        <span>{props.maxLabel}</span>
      </div>
    </section>
  );
};
