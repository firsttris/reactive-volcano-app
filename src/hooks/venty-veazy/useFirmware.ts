import { createEffect, createSignal, onCleanup } from "solid-js";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { bluetoothQueue } from "../../utils/bluetoothQueue";

export interface FirmwareData {
  applicationFlags: number; // Byte 1: bit 0 = application running (not bootloader)
  firmwareVersion: string | null; // Byte 2-7: ASCII
  bootloaderVersion: string | null; // Byte 11-16: ASCII
}

export function useFirmware(pollInterval = 60000) {
  const { getCharacteristics } = useBluetooth();
  const [data, setData] = createSignal<FirmwareData | null>(null);

  const decodeAscii = (value: DataView, start: number, length: number) =>
    new TextDecoder("utf-8").decode(
      new Uint8Array(value.buffer, value.byteOffset + start, length)
    );

  const parseFirmware = (value: DataView): FirmwareData => ({
    applicationFlags: value.getUint8(1),
    firmwareVersion: decodeAscii(value, 2, 6),
    bootloaderVersion: decodeAscii(value, 11, 6),
  });

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
    if (value && value.getUint8(0) === 0x02 && value.byteLength >= 19) {
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
