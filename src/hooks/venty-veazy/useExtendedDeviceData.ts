import { createEffect, createSignal, onCleanup } from "solid-js";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { bluetoothQueue } from "../../utils/bluetoothQueue";

export interface ExtendedDeviceData {
  heaterRuntimeMinutes: number | null; // Byte 1-3 (uint24)
  batteryChargingTimeMinutes: number | null; // Byte 4-6 (uint24)
}

export function useExtendedDeviceData(pollInterval = 30000) {
  const { getCharacteristics } = useBluetooth();
  const [data, setData] = createSignal<ExtendedDeviceData | null>(null);
  const parseExtendedDeviceData = (value: DataView): ExtendedDeviceData => {
    // Byte 1-3: HeaterRuntimeMinutes (uint24)
    const heaterRuntimeMinutes =
      value.getUint8(1) + value.getUint8(2) * 256 + value.getUint8(3) * 65536;
    // Byte 4-6: BatteryChargingTimeMinutes (uint24)
    const batteryChargingTimeMinutes =
      value.getUint8(4) + value.getUint8(5) * 256 + value.getUint8(6) * 65536;
    return {
      heaterRuntimeMinutes,
      batteryChargingTimeMinutes,
    };
  };

  const requestExtendedData = async () => {
    const buffer = new ArrayBuffer(20);
    const view = new DataView(buffer);
    view.setUint8(0, 4); // CMD 0x04
    view.setUint8(1, 0); // mask
    const control = getCharacteristics().control;
    if (control) {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    }
  };

  const handleExtendedData = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (value && value.getUint8(0) === 4) {
      setData(parseExtendedDeviceData(value));
    }
  };

  createEffect(() => {
    const control = getCharacteristics().control;
    if (!control) return;

    const interval = setInterval(requestExtendedData, pollInterval);
    control.addEventListener("characteristicvaluechanged", handleExtendedData);

    onCleanup(() => {
      clearInterval(interval);
      control.removeEventListener("characteristicvaluechanged", handleExtendedData);
    });
  });

  return {
    data,
    requestExtendedData,
  };
}
