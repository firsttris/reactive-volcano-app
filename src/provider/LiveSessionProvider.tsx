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
import type { TemperatureSample } from "../utils/heatProgress";
import {
  type ActiveSession,
  finishSession,
  type SessionReading,
  startSession,
  updateSession,
} from "../utils/sessionHistory";
import { useBluetooth } from "./BluetoothProvider";
import { useHistory } from "./HistoryProvider";

/** What a device view reports, temperatures in °C */
export interface LiveReading {
  current: number;
  target: number;
  heating: boolean;
  reached: boolean;
  pumping?: boolean;
  /** False until the device sent its first values */
  ready: boolean;
}

export const LIVE_WINDOW_MS = 10 * 60 * 1000;
const TICK_MS = 2_000;

const LiveSessionContext = createContext<Accessor<TemperatureSample[]>>();

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
  let active: ActiveSession | undefined;

  const finish = (time: number) => {
    if (!active) return;
    const session = finishSession(active, device, time, uuidv4());
    active = undefined;
    if (session) history.add(session);
  };

  const record = (reading: LiveReading) => {
    if (!reading.ready) return;
    const time = Date.now();

    setSamples((prev) => {
      const recent = prev.filter((s) => time - s.time <= LIVE_WINDOW_MS);
      const last = recent[recent.length - 1];
      // Notifications arrive in bursts; one point per tick is enough
      if (last && time - last.time < TICK_MS && last.temp === reading.current) {
        return recent;
      }
      return [...recent, { time, temp: reading.current }];
    });

    const sessionReading: SessionReading = {
      time,
      temp: reading.current,
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

  createEffect(() => record(props.reading()));
  // Readings only arrive on change, so keep the curve moving
  const timer = setInterval(() => record(props.reading()), TICK_MS);

  onCleanup(() => {
    clearInterval(timer);
    // Disconnecting ends the session
    finish(Date.now());
  });

  return (
    <LiveSessionContext.Provider value={samples}>
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
  return context;
};
