import { createEffect, createSignal, onCleanup } from "solid-js";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { bluetoothQueue } from "../../utils/bluetoothQueue";

export interface FirmwareData {
  firmwareVersion: string | null; // Byte 1-4 (z.B. 1.2.3.4)
  bootloaderVersion: string | null; // Byte 5-8 (z.B. 1.0.0.0)
}

export function useFirmware(pollInterval = 60000) {
  const { getCharacteristics } = useBluetooth();
  const [data, setData] = createSignal<FirmwareData | null>(null);

  const parseFirmware = (value: DataView): FirmwareData => {
    // Byte 1-4: Firmware-Version
    const firmwareVersion = [
      value.getUint8(1),
      value.getUint8(2),
      value.getUint8(3),
      value.getUint8(4),
    ].join(".");
    // Byte 5-8: Bootloader-Version
    const bootloaderVersion = [
      value.getUint8(5),
      value.getUint8(6),
      value.getUint8(7),
      value.getUint8(8),
    ].join(".");
    return { firmwareVersion, bootloaderVersion };
  };

  const requestFirmware = async () => {
    const buffer = new ArrayBuffer(20);
    const view = new DataView(buffer);
    view.setUint8(0, 0x02); // CMD 0x02 (Firmware)
    const control = getCharacteristics().control;
    if (control) {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    }
  };

  const handleFirmware = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (value && value.getUint8(0) === 0x02) {
      setData(parseFirmware(value));
    }
  };

  createEffect(() => {
    const control = getCharacteristics().control;
    if (!control) return;

    const interval = setInterval(requestFirmware, pollInterval);
    control.addEventListener("characteristicvaluechanged", handleFirmware);

    onCleanup(() => {
      clearInterval(interval);
      control.removeEventListener("characteristicvaluechanged", handleFirmware);
    });
  });

  return {
    data,
    requestFirmware,
  };
}
