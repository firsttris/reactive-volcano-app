import { onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import type { AnalysisResult } from "../shared/analysis";
import { createDebouncedWriter } from "../shared/debouncedWriter";
import type { VolcanoDriver, VolcanoValues } from "./driver";
import {
  analyzeVolcano,
  clamp,
  hasBit,
  Limits,
  Register1Bit,
  Register2Bit,
  Register3Bit,
} from "./protocol";

// +/- buttons and sliders fire many changes; only the last one is written.
// Values held by the writer are not overwritten by incoming notifications.
const WRITE_DEBOUNCE_MS = 300;
const IGNORE_UPDATES_AFTER_WRITE_MS = 1000;

type DebouncedField = "targetTemp" | "shutoffTime" | "brightness";

export interface VolcanoState extends VolcanoValues {
  loaded: boolean;
}

/**
 * Reactive state for a connected Volcano. Must be called inside a Solid owner
 * (component/provider); starts the driver and unsubscribes on cleanup.
 */
export const createVolcanoStore = (
  driver: VolcanoDriver,
  /** Told when the first reads fail, so the app can report it */
  onStartFailed?: (error: unknown) => void
) => {
  const [state, setState] = createStore<VolcanoState>({
    loaded: false,
    targetTemp: 0,
    currentTemp: 0,
    register1: 0,
    register2: 0,
    register3: 0,
    autoOffRemaining: 0,
    shutoffTime: 0,
    brightness: 0,
    heatingHours: 0,
    heatingMinutes: 0,
  });

  const writer = createDebouncedWriter<DebouncedField>({
    debounceMs: WRITE_DEBOUNCE_MS,
    holdAfterWriteMs: IGNORE_UPDATES_AFTER_WRITE_MS,
  });

  const handleUpdate = (update: Partial<VolcanoValues>) => {
    const next = { ...update };
    for (const field of Object.keys(next) as (keyof VolcanoValues)[]) {
      if (writer.isHeld(field as DebouncedField)) delete next[field];
    }
    setState(next);
  };

  // Subscribe before starting so the initial reads arrive
  const unsubscribe = driver.subscribe(handleUpdate);
  driver
    .start()
    .then(() => setState("loaded", true))
    .catch((error) => {
      console.error("Volcano start failed:", error);
      onStartFailed?.(error);
    });

  onCleanup(() => {
    unsubscribe();
    writer.dispose();
  });

  // Show a register bit change right away; the notification confirms it
  const setRegister1Bit = (bit: number, set: boolean) =>
    setState("register1", (register) =>
      set ? register | bit : register & ~bit
    );

  const actions = {
    /** Target temperature in °C, written after the user stops clicking */
    setTargetTemp(celsius: number) {
      const value = clamp(celsius, Limits.MIN_TEMP, Limits.MAX_TEMP);
      setState("targetTemp", value);
      writer.schedule("targetTemp", () => driver.setTargetTemperature(value));
    },
    /** Target temperature in °C, written immediately (for workflows) */
    async applyTargetTemp(celsius: number) {
      const value = clamp(celsius, Limits.MIN_TEMP, Limits.MAX_TEMP);
      setState("targetTemp", value);
      await driver.setTargetTemperature(value);
    },
    async setHeater(on: boolean) {
      setRegister1Bit(Register1Bit.HEATER, on);
      try {
        await (on ? driver.heaterOn() : driver.heaterOff());
      } catch (error) {
        // Show the state the device still has
        setRegister1Bit(Register1Bit.HEATER, !on);
        throw error;
      }
    },
    async setPump(on: boolean) {
      setRegister1Bit(Register1Bit.PUMP, on);
      try {
        await (on ? driver.pumpOn() : driver.pumpOff());
      } catch (error) {
        setRegister1Bit(Register1Bit.PUMP, !on);
        throw error;
      }
    },
    setShutoffTime(seconds: number) {
      setState("shutoffTime", seconds);
      writer.schedule("shutoffTime", () => driver.setShutoffTime(seconds));
    },
    setBrightness(value: number) {
      const brightness = clamp(
        value,
        Limits.MIN_BRIGHTNESS,
        Limits.MAX_BRIGHTNESS
      );
      setState("brightness", brightness);
      writer.schedule("brightness", () => driver.setBrightness(brightness));
    },
    setVibration(enabled: boolean) {
      setState("register3", (register) =>
        enabled
          ? register & ~Register3Bit.VIBRATION_DISABLED
          : register | Register3Bit.VIBRATION_DISABLED
      );
      return driver
        .setVibration(enabled)
        .catch((error) => console.error("Volcano vibration failed:", error));
    },
    setDisplayOnCooling(enabled: boolean) {
      setState("register2", (register) =>
        enabled
          ? register & ~Register2Bit.DISPLAY_ON_COOLING_DISABLED
          : register | Register2Bit.DISPLAY_ON_COOLING_DISABLED
      );
      return driver
        .setDisplayOnCooling(enabled)
        .catch((error) => console.error("Volcano display failed:", error));
    },
    /** Reads the registers and runs the self-check */
    async runAnalysis(): Promise<AnalysisResult> {
      const history = await driver.readDiagnostics();
      return analyzeVolcano({
        register1: state.register1,
        register2: state.register2,
        register3: state.register3,
        brightness: state.brightness,
        ...history,
        serialNumber: driver.info.serialNumber,
        now: new Date(),
      });
    },
    setIsCelsius(isCelsius: boolean) {
      setState("register2", (register) =>
        isCelsius
          ? register & ~Register2Bit.FAHRENHEIT
          : register | Register2Bit.FAHRENHEIT
      );
      return driver
        .setFahrenheit(!isCelsius)
        .catch((error) => console.error("Volcano unit failed:", error));
    },
  };

  const derived = {
    isHeating: () => hasBit(state.register1, Register1Bit.HEATER),
    isPumpActive: () => hasBit(state.register1, Register1Bit.PUMP),
    isAutoShutdownActive: () =>
      hasBit(state.register1, Register1Bit.AUTO_SHUTDOWN),
    isCelsius: () => !hasBit(state.register2, Register2Bit.FAHRENHEIT),
    isDisplayOnCooling: () =>
      !hasBit(state.register2, Register2Bit.DISPLAY_ON_COOLING_DISABLED),
    isVibrationOn: () =>
      !hasBit(state.register3, Register3Bit.VIBRATION_DISABLED),
  };

  return { state, actions, derived, info: driver.info };
};

export type VolcanoStore = ReturnType<typeof createVolcanoStore>;
