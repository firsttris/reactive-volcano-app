import { createEffect, createSignal, onCleanup } from "solid-js";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { bluetoothQueue } from "../../utils/bluetoothQueue";

export interface BrightnessVibrationData {
  brightness: number | null; // Byte 2: LED-Brightness
  vibration: number | null; // Byte 5: Vibration
  boostTimeout: number | null; // Byte 6: Boost/Superboost Timeout
}

export function useBrightnessVibration(pollInterval = 60000) {
  const { getCharacteristics } = useBluetooth();
  const [data, setData] = createSignal<BrightnessVibrationData | null>(null);
  const parseBrightnessVibration = (
    value: DataView
  ): BrightnessVibrationData => {
    // Byte 2: LED-Brightness
    const brightness = value.getUint8(2);
    // Byte 5: Vibration
    const vibration = value.getUint8(5);
    // Byte 6: Boost/Superboost Timeout
    const boostTimeout = value.getUint8(6);
    return {
      brightness,
      vibration,
      boostTimeout,
    };
  };

  const requestBrightnessVibration = async () => {
    const buffer = new ArrayBuffer(7);
    const view = new DataView(buffer);
    view.setUint8(0, 6); // CMD 0x06
    const control = getCharacteristics().control;
    if (control) {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    }
  };

  const handleBrightnessVibration = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (value && value.getUint8(0) === 6) {
      const parsed = parseBrightnessVibration(value);
      console.log("🔔 Brightness/Vibration data received:", {
        brightness: parsed.brightness,
        vibration: parsed.vibration,
        boostTimeout: parsed.boostTimeout,
      });
      setData(parsed);
    }
  };

  const setBrightness = async (val: number) => {
    // Byte 2: LED-Brightness
    setData((prev) => (prev ? { ...prev, brightness: val } : prev));
    const buffer = new ArrayBuffer(7);
    const view = new DataView(buffer);
    view.setUint8(0, 6); // CMD 0x06
    view.setUint8(1, 1 << 0); // Mask: Brightness bit
    view.setUint8(2, val); // Byte 2: Brightness
    const control = getCharacteristics().control;
    if (control) {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    }
  };

  const setVibration = async (val: number) => {
    // Byte 5: Vibration
    console.log("🔧 Setting vibration to:", val);
    setData((prev) => (prev ? { ...prev, vibration: val } : prev));
    const buffer = new ArrayBuffer(7);
    const view = new DataView(buffer);
    view.setUint8(0, 6); // CMD 0x06
    view.setUint8(1, 1 << 3); // Mask: Vibration bit (bit 3 = 8)
    view.setUint8(5, val); // Byte 5: Vibration
    console.log(
      "📤 Sending vibration buffer:",
      Array.from(new Uint8Array(buffer))
    );
    const control = getCharacteristics().control;
    if (control) {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    }
  };

  const setBoostTimeout = async (val: number) => {
    // Byte 6: Boost/Superboost Timeout
    setData((prev) => (prev ? { ...prev, boostTimeout: val } : prev));
    const buffer = new ArrayBuffer(7);
    const view = new DataView(buffer);
    view.setUint8(0, 6); // CMD 0x06
    view.setUint8(1, 1 << 4); // Mask: BoostTimeout bit (bit 4 = 16)
    view.setUint8(6, val); // Byte 6: BoostTimeout
    const control = getCharacteristics().control;
    if (control) {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    }
  };

  createEffect(() => {
    const control = getCharacteristics().control;
    if (!control) return;

    console.log("🔌 Requesting initial brightness/vibration data");
    requestBrightnessVibration();

    const interval = setInterval(requestBrightnessVibration, pollInterval);
    control.addEventListener("characteristicvaluechanged", handleBrightnessVibration);

    onCleanup(() => {
      clearInterval(interval);
      control.removeEventListener("characteristicvaluechanged", handleBrightnessVibration);
    });
  });

  return {
    data,
    requestBrightnessVibration,
    setBrightness,
    setVibration,
    setBoostTimeout,
  };
}
