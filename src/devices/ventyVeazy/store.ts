import { onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { createDebouncedWriter } from "./debouncedWriter";
import type { VentyVeazyDriver } from "./driver";
import {
  Command,
  HeaterMode,
  Limits,
  SettingsBit,
  clamp,
  encodeBoostTemperature,
  encodeBoostTimeoutDisabled,
  encodeBoostVisualization,
  encodeBrightness,
  encodeFactoryReset,
  encodeFindMyDevice,
  encodeHeaterMode,
  encodeIsCelsius,
  encodePermanentBluetooth,
  encodeReadBrightnessVibration,
  encodeRequest,
  encodeSettingsBit,
  encodeSuperBoostTemperature,
  encodeTargetTemperature,
  encodeVibration,
  toDisplayOffset,
  toDisplayTemperature,
  type BrightnessVibrationResponse,
  type DeviceDataResponse,
  type ExtendedDataResponse,
  type FirmwareResponse,
  type Response,
  type StatusResponse,
} from "./protocol";

// Temperature writes are delayed until the user stops clicking (like the
// legacy app); afterwards polled values are ignored for a moment so the
// display does not jump back to the old value.
const WRITE_DEBOUNCE_MS = 500;
const IGNORE_POLL_AFTER_WRITE_MS = 1500;

type DebouncedField = "targetTemp" | "boostTemp" | "superBoostTemp";

export interface VentyVeazyState {
  status: StatusResponse | null;
  firmware: FirmwareResponse | null;
  extendedData: ExtendedDataResponse | null;
  deviceData: DeviceDataResponse | null;
  brightnessVibration: BrightnessVibrationResponse | null;
  findMyDeviceActive: boolean;
}

/**
 * Reactive state for a connected Venty/Veazy. Must be called inside a Solid
 * owner (component/provider); starts the driver and unsubscribes on cleanup.
 */
export const createVentyVeazyStore = (driver: VentyVeazyDriver) => {
  const [state, setState] = createStore<VentyVeazyState>({
    status: null,
    firmware: null,
    extendedData: null,
    deviceData: null,
    brightnessVibration: null,
    findMyDeviceActive: false,
  });

  const writer = createDebouncedWriter<DebouncedField>({
    debounceMs: WRITE_DEBOUNCE_MS,
    holdAfterWriteMs: IGNORE_POLL_AFTER_WRITE_MS,
  });

  const send = (frame: ArrayBuffer) =>
    driver.send(frame).catch((error) => {
      console.error("Venty/Veazy write failed:", error);
    });

  const handleStatus = (status: StatusResponse) => {
    const previous = state.status;
    const next = { ...status };
    if (previous) {
      for (const field of [
        "targetTemp",
        "boostTemp",
        "superBoostTemp",
      ] as const) {
        if (writer.isHeld(field)) next[field] = previous[field];
      }
    }
    setState("status", next);

    // The device leaves find-my mode once it is connected again
    if (state.findMyDeviceActive) {
      setState("findMyDeviceActive", false);
      send(encodeRequest(Command.DEVICE_DATA));
      send(encodeReadBrightnessVibration());
    }
  };

  const handleResponse = (response: Response) => {
    switch (response.command) {
      case Command.STATUS:
        return handleStatus(response.data);
      case Command.FIRMWARE:
        return setState("firmware", response.data);
      case Command.EXTENDED_DATA:
        return setState("extendedData", response.data);
      case Command.DEVICE_DATA:
        return setState("deviceData", response.data);
      case Command.BRIGHTNESS_VIBRATION:
        return setState("brightnessVibration", response.data);
      case Command.ADVERTISING_INFO:
        return setState("findMyDeviceActive", response.data.findMyDeviceActive);
    }
  };

  // Subscribe before starting so the answers to the init requests arrive
  const unsubscribe = driver.subscribe(handleResponse);
  driver.start().catch((error) => {
    console.error("Venty/Veazy start failed:", error);
  });

  onCleanup(() => {
    unsubscribe();
    writer.dispose();
  });

  const updateStatus = <K extends keyof StatusResponse>(
    key: K,
    value: StatusResponse[K]
  ) => {
    if (state.status) setState("status", key, value);
  };

  const updateBrightnessVibration = <
    K extends keyof BrightnessVibrationResponse,
  >(
    key: K,
    value: BrightnessVibrationResponse[K]
  ) => {
    if (state.brightnessVibration) {
      setState("brightnessVibration", key, value);
    }
  };

  const actions = {
    /** Target temperature in °C */
    setTargetTemp(celsius: number) {
      const value = clamp(celsius, Limits.MIN_TEMP, Limits.MAX_TEMP);
      updateStatus("targetTemp", value);
      writer.schedule("targetTemp", () => send(encodeTargetTemperature(value)));
    },
    /** Boost offset in °C */
    setBoostTemp(offset: number) {
      const value = clamp(offset, Limits.MIN_BOOST, Limits.MAX_BOOST);
      updateStatus("boostTemp", value);
      writer.schedule("boostTemp", () => send(encodeBoostTemperature(value)));
    },
    /** Superboost offset in °C */
    setSuperBoostTemp(offset: number) {
      const value = clamp(offset, Limits.MIN_BOOST, Limits.MAX_BOOST);
      updateStatus("superBoostTemp", value);
      writer.schedule("superBoostTemp", () =>
        send(encodeSuperBoostTemperature(value))
      );
    },
    setHeaterMode(mode: number) {
      updateStatus("heaterMode", mode);
      return send(encodeHeaterMode(mode));
    },
    toggleHeater() {
      const isOn = (state.status?.heaterMode ?? HeaterMode.OFF) > 0;
      return actions.setHeaterMode(isOn ? HeaterMode.OFF : HeaterMode.NORMAL);
    },
    setIsCelsius(isCelsius: boolean) {
      updateStatus("isCelsius", isCelsius);
      return send(encodeIsCelsius(isCelsius));
    },
    setChargeCurrentOptimization(enabled: boolean) {
      updateStatus("chargeCurrentOptimization", enabled);
      return send(
        encodeSettingsBit(SettingsBit.CHARGE_CURRENT_OPTIMIZATION, enabled)
      );
    },
    setChargeVoltageLimit(enabled: boolean) {
      updateStatus("chargeVoltageLimit", enabled);
      return send(encodeSettingsBit(SettingsBit.CHARGE_VOLTAGE_LIMIT, enabled));
    },
    setBoostVisualization(enabled: boolean) {
      updateStatus("boostVisualization", enabled);
      return send(encodeBoostVisualization(enabled, driver.model));
    },
    setPermanentBluetooth(enabled: boolean) {
      updateStatus("permanentBluetooth", enabled);
      return send(encodePermanentBluetooth(enabled));
    },
    setBrightness(brightness: number) {
      const value = clamp(
        brightness,
        Limits.MIN_BRIGHTNESS,
        Limits.MAX_BRIGHTNESS
      );
      updateBrightnessVibration("brightness", value);
      return send(encodeBrightness(value));
    },
    setVibration(enabled: boolean) {
      updateBrightnessVibration("vibration", enabled);
      return send(encodeVibration(enabled));
    },
    setBoostTimeoutDisabled(disabled: boolean) {
      updateBrightnessVibration("boostTimeoutDisabled", disabled);
      return send(encodeBoostTimeoutDisabled(disabled));
    },
    async factoryReset() {
      await send(encodeFactoryReset());
      // Settings of the 0x06 frame are not part of the status poll
      await send(encodeReadBrightnessVibration());
    },
    triggerFindMyDevice() {
      return send(encodeFindMyDevice());
    },
  };

  const isCelsius = () => state.status?.isCelsius ?? true;

  /** Values converted to the unit the device is set to */
  const display = {
    targetTemp: () =>
      toDisplayTemperature(state.status?.targetTemp ?? 0, isCelsius()),
    boostTemp: () => toDisplayOffset(state.status?.boostTemp ?? 0, isCelsius()),
    superBoostTemp: () =>
      toDisplayOffset(state.status?.superBoostTemp ?? 0, isCelsius()),
    effectiveTemp: () => {
      const status = state.status;
      if (!status) return 0;
      let celsius = status.targetTemp;
      if (status.heaterMode === HeaterMode.BOOST) celsius += status.boostTemp;
      if (status.heaterMode === HeaterMode.SUPERBOOST) {
        celsius += status.superBoostTemp;
      }
      return toDisplayTemperature(celsius, isCelsius());
    },
  };

  return { state, actions, display, model: driver.model };
};

export type VentyVeazyStore = ReturnType<typeof createVentyVeazyStore>;
