import { onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { createDebouncedWriter } from "../shared/debouncedWriter";
import type { CraftyDriver, CraftyUpdate, CraftyValues } from "./driver";
import {
  clamp,
  isHeaterActive,
  isSetpointReached,
  Limits,
  ProjectRegisterBit,
} from "./protocol";

// Sliders and +/- buttons fire many changes; only the last one is written.
// Values held by the writer are not overwritten by incoming updates.
const WRITE_DEBOUNCE_MS = 300;
const IGNORE_UPDATES_AFTER_WRITE_MS = 1000;

type DebouncedField =
  | "targetTemp"
  | "boostTemp"
  | "ledBrightness"
  | "autoOffCountdown";

export interface CraftyState extends CraftyValues {
  loaded: boolean;
}

/**
 * Reactive state for a connected Crafty. Must be called inside a Solid owner
 * (component/provider); starts the driver and unsubscribes on cleanup.
 */
export const createCraftyStore = (driver: CraftyDriver) => {
  const [state, setState] = createStore<CraftyState>({
    loaded: false,
    targetTemp: 0,
    currentTemp: 0,
    boostTemp: 0,
    batteryLevel: 0,
    ledBrightness: 0,
    useHours: 0,
    projectRegister: 0,
    statusRegister2: 0,
    bleFirmwareVersion: null,
    useMinutes: null,
    autoOffCountdown: null,
    autoOffRemaining: null,
    systemStatus: null,
    akkuStatus: null,
    akkuStatus2: null,
  });

  const writer = createDebouncedWriter<DebouncedField>({
    debounceMs: WRITE_DEBOUNCE_MS,
    holdAfterWriteMs: IGNORE_UPDATES_AFTER_WRITE_MS,
  });

  const handleUpdate = (update: CraftyUpdate) => {
    const next: CraftyUpdate = { ...update };
    for (const field of Object.keys(next) as (keyof CraftyUpdate)[]) {
      if (writer.isHeld(field as DebouncedField)) delete next[field];
    }
    setState(next);
  };

  // Subscribe before starting so the initial reads arrive
  const unsubscribe = driver.subscribe(handleUpdate);
  driver
    .start()
    .then(() => setState("loaded", true))
    .catch((error) => console.error("Crafty start failed:", error));

  onCleanup(() => {
    unsubscribe();
    writer.dispose();
  });

  const logError = (action: string) => (error: unknown) =>
    console.error(`Crafty ${action} failed:`, error);

  const actions = {
    /** Target temperature in °C */
    setTargetTemp(celsius: number) {
      const value = clamp(celsius, Limits.MIN_TEMP, Limits.MAX_TEMP);
      setState("targetTemp", value);
      writer.schedule("targetTemp", () => driver.setTargetTemperature(value));
    },
    /** Boost offset in °C; target + boost must not exceed the maximum */
    setBoostTemp(celsius: number) {
      const value = clamp(
        celsius,
        Limits.MIN_BOOST,
        Math.min(Limits.MAX_BOOST, Limits.MAX_TEMP - state.targetTemp)
      );
      setState("boostTemp", value);
      writer.schedule("boostTemp", () => driver.setBoostTemperature(value));
    },
    setLedBrightness(value: number) {
      const brightness = clamp(
        value,
        Limits.MIN_BRIGHTNESS,
        Limits.MAX_BRIGHTNESS
      );
      setState("ledBrightness", brightness);
      writer.schedule("ledBrightness", () =>
        driver.setLedBrightness(brightness)
      );
    },
    setAutoOffCountdown(seconds: number) {
      const value = clamp(seconds, Limits.MIN_AUTO_OFF, Limits.MAX_AUTO_OFF);
      setState("autoOffCountdown", value);
      writer.schedule("autoOffCountdown", () =>
        driver.setAutoOffCountdown(value)
      );
    },
    toggleHeater() {
      const turnOn = !isHeaterActive(state.projectRegister);
      // Show the new state right away; the project register notification
      // confirms it
      setState(
        "projectRegister",
        (register) => register ^ ProjectRegisterBit.HEATER_ACTIVE
      );
      const command = turnOn ? driver.heaterOn() : driver.heaterOff();
      return command.catch(logError("heater toggle"));
    },
    factoryReset() {
      return driver.factoryReset().catch(logError("factory reset"));
    },
  };

  const derived = {
    isHeaterActive: () => isHeaterActive(state.projectRegister),
    isSetpointReached: () => isSetpointReached(state.statusRegister2),
  };

  return {
    state,
    actions,
    derived,
    firmwareVersion: driver.firmwareVersion,
    isOldFirmware: driver.isOldFirmware,
  };
};

export type CraftyStore = ReturnType<typeof createCraftyStore>;
