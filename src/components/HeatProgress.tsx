import { createEffect, createSignal, on, onCleanup, Show } from "solid-js";
import { styled } from "solid-styled-components";
import { useTranslations } from "../i18n/utils";
import {
  estimateSecondsRemaining,
  formatDuration,
  getHeatProgress,
  getHeatStatus,
  type HeatStatus,
  RATE_WINDOW_MS,
  type TemperatureSample,
} from "../utils/heatProgress";

interface HeatProgressProps {
  /** Temperatures in °C */
  current: number;
  target: number;
  heating: boolean;
  /** Device-reported "setpoint reached", overrides the tolerance check */
  reached?: boolean;
}

const Container = styled("div")`
  width: 100%;
  max-width: 320px;
  margin: 0 auto 24px;
`;

const Track = styled("div")`
  height: 8px;
  border-radius: 4px;
  background: var(--border-color);
  overflow: hidden;
`;

const statusColor = (status: HeatStatus) => {
  if (status === "reached") return "var(--reached-color)";
  if (status === "off") return "var(--secondary-text)";
  return "var(--heating-color)";
};

const Fill = styled("div")<{ status: HeatStatus }>`
  height: 100%;
  border-radius: 4px;
  background: ${(props) => statusColor(props.status)};
  opacity: ${(props) => (props.status === "off" ? 0.4 : 1)};
  transition:
    width 0.5s ease,
    background 0.3s ease;
`;

const StatusRow = styled("div")`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--secondary-text);
`;

const StatusText = styled("span")<{ status: HeatStatus }>`
  font-weight: 600;
  color: ${(props) =>
    props.status === "off"
      ? "var(--secondary-text)"
      : statusColor(props.status)};
`;

export const HeatProgress = (props: HeatProgressProps) => {
  const t = useTranslations();
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

  const progress = () =>
    status() === "off" ? 0 : getHeatProgress(props.current, props.target);

  const eta = () =>
    status() === "heating"
      ? estimateSecondsRemaining(samples(), props.target, now())
      : null;

  const label = () => {
    switch (status()) {
      case "off":
        return t("heaterOff");
      case "reached":
        return t("temperatureReached");
      case "cooling":
        return t("coolingDown");
      default:
        return t("heatingUp");
    }
  };

  return (
    <Container>
      <Track
        role="progressbar"
        aria-label={label()}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress() * 100)}
      >
        <Fill status={status()} style={{ width: `${progress() * 100}%` }} />
      </Track>
      <StatusRow>
        <StatusText status={status()}>{label()}</StatusText>
        <Show when={eta()}>
          {(seconds) => (
            <span>
              {t("remaining")} ~{formatDuration(seconds())}
            </span>
          )}
        </Show>
      </StatusRow>
    </Container>
  );
};
