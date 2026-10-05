import {
  type Accessor,
  createContext,
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  useContext,
} from "solid-js";
import { v4 as uuidv4 } from "uuid";
import { deviceLabel } from "../components/AppHeader";
import { useWakeLock } from "../hooks/utils/useWakeLock";
import { m } from "../paraglide/messages";
import { convertCelsiusToFahrenheit } from "../utils/bluetoothUtils";
import type { TemperatureSample } from "../utils/heatProgress";
import { alertTargetReached } from "../utils/notify";
import {
  type ActiveSession,
  finishSession,
  isPlausibleTemp,
  type SessionReading,
  startSession,
  updateSession,
} from "../utils/sessionHistory";
import { useBluetooth } from "./BluetoothProvider";
import { useHistory } from "./HistoryProvider";

/** What a device view reports, temperatures in °C */
export interface LiveReading {
  /** Undefined when the device does not measure it (Venty/Veazy) */
  current?: number;
  target: number;
  heating: boolean;
  reached: boolean;
  pumping?: boolean;
  /** False until the device sent its first values */
  ready: boolean;
  /** The unit the device shows; °C if unset */
  isCelsius?: boolean;
}

export const LIVE_WINDOW_MS = 10 * 60 * 1000;
const TICK_MS = 2_000;

interface LiveSession {
  samples: Accessor<TemperatureSample[]>;
  isCelsius: Accessor<boolean>;
}

const LiveSessionContext = createContext<LiveSession>();

/**
 * Keeps the recent temperature curve and records heater sessions into the
 * history; lives at device level so it keeps running across tabs
 */
export const LiveSessionProvider = (props: {
  reading: () => LiveReading;
  children: JSX.Element;
}) => {
  const history = useHistory();
  const { deviceInfo } = useBluetooth();
  // Read once: the provider only lives while one device is connected
  const device = deviceLabel(deviceInfo());
  const [samples, setSamples] = createSignal<TemperatureSample[]>([]);
  const isCelsius = () => props.reading().isCelsius ?? true;
  let active: ActiveSession | undefined;
  let previous: LiveReading | undefined;

  // Lives here rather than in the gauge, so it also fires on other tabs
  const alertWhenReached = (reading: LiveReading) => {
    const wasHeatingUp =
      previous?.heating &&
      !previous.reached &&
      (previous.current === undefined || previous.current < previous.target);
    previous = reading;
    if (!wasHeatingUp || !reading.heating || !reading.reached) return;
    const target = isCelsius()
      ? reading.target
      : convertCelsiusToFahrenheit(reading.target);
    navigator.vibrate?.(200);
    alertTargetReached(
      m.heat_reached(),
      m.notify_reachedBody({
        device,
        temperature: `${target} °${isCelsius() ? "C" : "F"}`,
      })
    );
  };

  const finish = (time: number) => {
    if (!active) return;
    const session = finishSession(active, device, time, uuidv4());
    active = undefined;
    if (session) history.add(session);
  };

  const record = (reading: LiveReading) => {
    if (!reading.ready) return;
    const time = Date.now();

    const current = reading.current;
    if (isPlausibleTemp(current ?? null)) {
      setSamples((prev) => {
        const recent = prev.filter((s) => time - s.time <= LIVE_WINDOW_MS);
        const last = recent[recent.length - 1];
        // Notifications arrive in bursts; one point per tick is enough
        if (last && time - last.time < TICK_MS && last.temp === current) {
          return recent;
        }
        return [...recent, { time, temp: current as number }];
      });
    }

    const sessionReading: SessionReading = {
      time,
      temp: reading.current ?? null,
      target: reading.target,
      heating: reading.heating,
      reached: reading.reached,
      pumping: reading.pumping ?? false,
    };
    if (reading.heating) {
      active = active
        ? updateSession(active, sessionReading)
        : startSession(sessionReading);
    } else {
      finish(time);
    }
  };

  // Keep the screen on while the device heats, on every tab
  useWakeLock(() => props.reading().heating);

  createEffect(() => {
    const reading = props.reading();
    record(reading);
    if (reading.ready) alertWhenReached(reading);
  });
  // Readings only arrive on change, so keep the curve moving
  const timer = setInterval(() => record(props.reading()), TICK_MS);

  onCleanup(() => {
    clearInterval(timer);
    // Disconnecting ends the session
    finish(Date.now());
  });

  return (
    <LiveSessionContext.Provider value={{ samples, isCelsius }}>
      {props.children}
    </LiveSessionContext.Provider>
  );
};

/** Temperature samples of the last minutes, oldest first */
export const useLiveSamples = () => {
  const context = useContext(LiveSessionContext);
  if (!context) {
    throw new Error("useLiveSamples must be used within LiveSessionProvider");
  }
  return context.samples;
};

/** Formats a temperature in °C in the unit the connected device shows */
export const useTemperatureFormat = () => {
  const context = useContext(LiveSessionContext);
  return (celsius: number) => {
    const isCelsius = context?.isCelsius() ?? true;
    const value = isCelsius ? celsius : convertCelsiusToFahrenheit(celsius);
    return `${value} °${isCelsius ? "C" : "F"}`;
  };
};
