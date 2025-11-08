import { createEffect, createSignal, onCleanup } from "solid-js";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { bluetoothQueue } from "../../utils/bluetoothQueue";

export interface DeviceData {
  serialNumber: string | null; // Bytes 15-16 (prefix) + Bytes 9-14 (name)
  colorIndex: number | null; // Byte 18
}

export function useDeviceData(pollInterval = 60000) {
  const { getCharacteristics } = useBluetooth();
  const [data, setData] = createSignal<DeviceData | null>(null);
  const parseDeviceData = (value: DataView): DeviceData => {
    // Serial number: Prefix (Bytes 15-16) + Name (Bytes 9-14)
    const decoder = new TextDecoder("utf-8");
    const tmpPrefix = value.buffer.slice(15, 17); // Bytes 15-16
    const tmpName = value.buffer.slice(9, 15); // Bytes 9-14
    const serialNumber = decoder.decode(tmpPrefix) + decoder.decode(tmpName);
    // Byte 18: Color Index
    const colorIndex = value.getUint8(18);
    return {
      serialNumber,
      colorIndex,
    };
  };

  const requestDeviceData = async () => {
    const buffer = new ArrayBuffer(20);
    const view = new DataView(buffer);
    view.setUint8(0, 5); // CMD 0x05
    view.setUint8(1, 0); // mask
    const control = getCharacteristics().control;
    if (control) {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    }
  };

  const handleDeviceData = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (value && value.getUint8(0) === 5) {
      setData(parseDeviceData(value));
    }
  };

  createEffect(() => {
    const control = getCharacteristics().control;
    if (!control) return;

    const interval = setInterval(requestDeviceData, pollInterval);
    control.addEventListener("characteristicvaluechanged", handleDeviceData);

    onCleanup(() => {
      clearInterval(interval);
      control.removeEventListener(
        "characteristicvaluechanged",
        handleDeviceData
      );
    });
  });

  return {
    data,
    requestDeviceData,
  };
}
