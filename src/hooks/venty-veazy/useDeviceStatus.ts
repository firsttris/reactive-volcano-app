import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { bluetoothQueue } from "../../utils/bluetoothQueue";

export interface DeviceStatus {
  targetTemp: number | null;
  boostTemp: number | null;
  superBoostTemp: number | null;
  batteryLevel: number | null;
  autoShutdownTimer: number | null;
  heaterMode: number | null;
  isHeating: boolean;
  isCharging: boolean;
  isCelsius: boolean;
  setpointReached: boolean;
  chargeCurrentOptimization: boolean;
  chargeVoltageLimit: boolean;
  permanentBluetooth: boolean;
  boostVisualization: boolean;
}

const MIN_TEMP = 40;
const MAX_TEMP = 210;
const MIN_BOOST = 1;
const MAX_BOOST = 99;

// Temperature writes are delayed until the user stops clicking (like the
// legacy app), and polled values are ignored shortly after a write so the
// display does not jump back to the old value.
const WRITE_DEBOUNCE_MS = 500;
const IGNORE_POLL_AFTER_WRITE_MS = 1500;

type PendingField = "targetTemp" | "boostTemp" | "superBoostTemp";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function useDeviceStatus(pollInterval = 500) {
  const { getCharacteristics, deviceInfo } = useBluetooth();
  const [status, setStatus] = createSignal<DeviceStatus | null>(null);

  const writeTimers: Partial<Record<PendingField, number>> = {};
  const ignorePollUntil: Record<PendingField, number> = {
    targetTemp: 0,
    boostTemp: 0,
    superBoostTemp: 0,
  };

  const convertToFahrenheit = (celsius: number): number => {
    return Math.round(celsius * 1.8 + 32);
  };

  const targetTemp = createMemo(() => {
    const s = status();
    if (!s || s.targetTemp === null) return 0;
    return s.isCelsius ? s.targetTemp : convertToFahrenheit(s.targetTemp);
  });

  const boostTemp = createMemo(() => {
    const s = status();
    if (!s || s.boostTemp === null) return 0;
    // Boost offset in Fahrenheit shown as (F - 32)
    return s.isCelsius
      ? s.boostTemp
      : Math.round(convertToFahrenheit(s.boostTemp) - 32);
  });

  const superBoostTemp = createMemo(() => {
    const s = status();
    if (!s || s.superBoostTemp === null) return 0;
    // SuperBoost offset in Fahrenheit shown as (F - 32)
    return s.isCelsius
      ? s.superBoostTemp
      : Math.round(convertToFahrenheit(s.superBoostTemp) - 32);
  });

  const effectiveTemp = createMemo(() => {
    const s = status();
    if (!s) return 0;

    const mode = s.heaterMode;
    const target = s.targetTemp ?? 0;
    const boost = s.boostTemp ?? 0;
    const superboost = s.superBoostTemp ?? 0;

    let effectiveCelsius = target;
    if (mode === 2) effectiveCelsius = target + boost;
    else if (mode === 3) effectiveCelsius = target + superboost;

    return s.isCelsius
      ? effectiveCelsius
      : convertToFahrenheit(effectiveCelsius);
  });

  const parseDeviceStatus = (value: DataView): DeviceStatus => {
    // Check minimum required bytes
    if (value.byteLength < 15) {
      console.warn(
        "parseDeviceStatus: Response too short, expected at least 15 bytes, got",
        value.byteLength
      );
      throw new Error(
        `Invalid response length: ${value.byteLength} bytes (expected at least 15)`
      );
    }

    const info = deviceInfo();

    // Calculate target temperature
    const byte4 = value.getUint8(4);
    const byte5 = value.getUint8(5);
    const targetTemp = Math.round((byte4 + byte5 * 256) / 10);

    // Byte 14: settings flags
    //   bit 0 (0x01): 0 = Celsius, 1 = Fahrenheit
    //   bit 1 (0x02): Setpoint Reached (read-only)
    //   bit 2 (0x04): Factory Reset (write-only command)
    //   bit 3 (0x08): Charge Current Optimization
    //   bit 4 (0x10): Button Changed (read-only)
    //   bit 5 (0x20): Charge Voltage Limit
    //   bit 6 (0x40): Boost Visualization (vibration is in CMD 0x06, byte 5)
    const settings = value.getUint8(14);
    // Byte 11: Heater mode (0=off, 1=normal, 2=boost, 3=superboost)
    const heaterModeValue = value.getUint8(11);
    // Byte 13: Charger connected (0=not charging, >0=charging)
    const chargerConnected = value.getUint8(13);
    // Byte 9+10: Auto-Shutdown-Timer (Sekunden)
    const autoShutdownTimer = value.getUint8(9) + value.getUint8(10);
    // Byte 16: Permanent Bluetooth (bit 0) - may not exist on all devices
    //   bit 0 (0x01): Permanent Bluetooth enabled
    const permanentBluetooth =
      value.byteLength > 16 ? !!(value.getUint8(16) & 0x01) : false;

    // Byte 14, bit 6: Boost Visualization (für VEAZY invertiert)
    const boostVisualization =
      info.type === "VEAZY" ? !(settings & 0x40) : !!(settings & 0x40);
    return {
      // Byte 4+5: Target temperature (uint16 LE, /10)
      targetTemp,
      // Byte 6: Boost temperature
      boostTemp: value.getUint8(6),
      // Byte 7: Super Boost temperature
      superBoostTemp: value.getUint8(7),
      // Byte 8: Battery level (0-100)
      batteryLevel: value.getUint8(8),
      // Byte 9+10: Auto-Shutdown-Timer (Sekunden)
      autoShutdownTimer,
      // Byte 11: Heater mode
      heaterMode: heaterModeValue,
      // Byte 11: Heater mode > 0 = heating
      isHeating: heaterModeValue > 0,
      // Byte 13: Charger connected > 0 = charging
      isCharging: chargerConnected > 0,
      // Byte 14, bit 0: 0 = Celsius, 1 = Fahrenheit
      isCelsius: !(settings & 0x01),
      // Byte 14, bit 1: Setpoint Reached (target temperature reached)
      setpointReached: !!(settings & 0x02),
      // Byte 14, bit 3: Charge Current Optimization
      chargeCurrentOptimization: !!(settings & 0x08),
      // Byte 14, bit 5: Charge Voltage Limit
      chargeVoltageLimit: !!(settings & 0x20),
      // Byte 16, bit 0: Permanent Bluetooth enabled
      permanentBluetooth,
      // Byte 14, bit 6: Boost Visualization (für VEAZY invertiert)
      boostVisualization,
    };
  };

  const requestStatus = async () => {
    const buffer = new ArrayBuffer(20);
    const view = new DataView(buffer);
    view.setUint8(0, 1); // CMD 0x01
    view.setUint8(1, 0); // mask
    const control = getCharacteristics().control;
    if (control) {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    }
  };

  const handleStatus = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (!value || value.getUint8(0) !== 1 || value.byteLength < 15) return;

    const parsed = parseDeviceStatus(value);
    const prev = status();
    if (prev) {
      const now = Date.now();
      for (const field of Object.keys(ignorePollUntil) as PendingField[]) {
        if (now < ignorePollUntil[field]) {
          parsed[field] = prev[field];
        }
      }
    }
    setStatus(parsed);
  };

  async function writeDeviceStatus(
    cmd: number,
    mask: number,
    byteMap: Record<number, number>
  ) {
    const buffer = new ArrayBuffer(20);
    const dataView = new DataView(buffer);
    dataView.setUint8(0, cmd);
    dataView.setUint8(1, mask);
    for (const [byte, value] of Object.entries(byteMap)) {
      dataView.setUint8(Number(byte), value);
    }
    const control = getCharacteristics().control;
    if (control) await bluetoothQueue.add(() => control.writeValue(buffer));
  }

  // Updates the UI immediately and writes to the device once the value
  // has not changed for WRITE_DEBOUNCE_MS
  const scheduleTemperatureWrite = (
    field: PendingField,
    val: number,
    write: () => Promise<void>
  ) => {
    setStatus((prev) => (prev ? { ...prev, [field]: val } : prev));
    ignorePollUntil[field] = Number.POSITIVE_INFINITY;
    clearTimeout(writeTimers[field]);
    writeTimers[field] = window.setTimeout(async () => {
      delete writeTimers[field];
      try {
        await write();
      } catch (error) {
        console.error(`Failed to write ${field}:`, error);
      } finally {
        if (!writeTimers[field]) {
          ignorePollUntil[field] = Date.now() + IGNORE_POLL_AFTER_WRITE_MS;
        }
      }
    }, WRITE_DEBOUNCE_MS);
  };

  const setTargetTemp = async (val: number | null) => {
    // Byte 4+5: Target temperature (uint16 LE, /10)
    if (val === null) return;
    const temp = clamp(val, MIN_TEMP, MAX_TEMP);
    scheduleTemperatureWrite("targetTemp", temp, () => {
      const tempValue = temp * 10;
      // Byte 4: low byte, Byte 5: high byte
      return writeDeviceStatus(1, 2, {
        4: tempValue & 0xff, // Byte 4: Temperatur (low)
        5: (tempValue >> 8) & 0xff, // Byte 5: Temperatur (high)
      });
    });
  };

  const setBoostTemp = async (val: number | null) => {
    // Byte 6: Boost temperature
    if (val === null) return;
    const temp = clamp(val, MIN_BOOST, MAX_BOOST);
    scheduleTemperatureWrite("boostTemp", temp, () =>
      writeDeviceStatus(1, 4, { 6: temp })
    );
  };

  const setSuperBoostTemp = async (val: number | null) => {
    // Byte 7: Super Boost temperature
    if (val === null) return;
    const temp = clamp(val, MIN_BOOST, MAX_BOOST);
    scheduleTemperatureWrite("superBoostTemp", temp, () =>
      writeDeviceStatus(1, 8, { 7: temp })
    );
  };

  const setHeaterMode = async (val: number | null) => {
    // Byte 11: Heater mode (0=off, 1=normal, 2=boost, 3=superboost)
    setStatus((prev) => (prev ? { ...prev, heaterMode: val } : prev));
    if (val !== null) {
      await writeDeviceStatus(1, 32, { 11: val }); // Byte 11: Heater mode
    }
  };

  const setIsCelsius = async (val: boolean) => {
    // Byte 14, bit 0: 0 = Celsius, 1 = Fahrenheit
    // Byte 15: BIT_SETTINGS_UNIT
    setStatus((prev) => (prev ? { ...prev, isCelsius: val } : prev));
    await writeDeviceStatus(1, 128, { 14: val ? 0 : 1, 15: 1 });
  };

  const setChargeCurrentOptimization = async (val: boolean) => {
    // Byte 14, bit 3: Charge Current Optimization
    // Byte 15: BIT_SETTINGS_CHARGE_CURRENT_OPTIMIZATION
    setStatus((prev) =>
      prev ? { ...prev, chargeCurrentOptimization: val } : prev
    );
    await writeDeviceStatus(1, 128, { 14: val ? 0x08 : 0x00, 15: 8 });
  };

  const setChargeVoltageLimit = async (val: boolean) => {
    // Byte 14, bit 5: Charge Voltage Limit
    // Byte 15: BIT_SETTINGS_CHARGE_VOLTAGE_LIMIT
    setStatus((prev) => (prev ? { ...prev, chargeVoltageLimit: val } : prev));
    await writeDeviceStatus(1, 128, { 14: val ? 0x20 : 0x00, 15: 32 });
  };

  const setPermanentBluetooth = async (val: boolean) => {
    // Byte 16, bit 0: Permanent Bluetooth enabled
    // Byte 17: BIT_SETTINGS2_BLE_PERMANENT mask
    setStatus((prev) => (prev ? { ...prev, permanentBluetooth: val } : prev));
    await writeDeviceStatus(1, 128, { 16: val ? 0x01 : 0x00, 17: 1 });
  };

  createEffect(() => {
    const control = getCharacteristics().control;
    if (!control) return;

    const interval = setInterval(requestStatus, pollInterval);
    control.addEventListener("characteristicvaluechanged", handleStatus);

    onCleanup(() => {
      clearInterval(interval);
      control.removeEventListener("characteristicvaluechanged", handleStatus);
      for (const timer of Object.values(writeTimers)) clearTimeout(timer);
    });
  });

  return {
    status,
    setTargetTemp,
    setBoostTemp,
    setSuperBoostTemp,
    setHeaterMode,
    setIsCelsius,
    setChargeCurrentOptimization,
    setChargeVoltageLimit,
    setPermanentBluetooth,
    // Display-ready computed values (already converted to current unit)
    targetTemp,
    boostTemp,
    superBoostTemp,
    effectiveTemp,
  };
}
