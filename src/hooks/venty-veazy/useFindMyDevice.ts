import { createEffect, createSignal, onCleanup } from "solid-js";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { bluetoothQueue } from "../../utils/bluetoothQueue";

export function useFindMyDevice() {
  const { getCharacteristics } = useBluetooth();
  const [findMyDeviceActive, setFindMyDeviceActive] =
    createSignal<boolean>(false);

  const triggerFindMyDevice = async () => {
    const buffer = new ArrayBuffer(20);
    const view = new DataView(buffer);
    view.setUint8(0, 0x0d); // CMD 0x0D (13 decimal) - Trigger Find My Device
    view.setUint8(1, 0x01); // Mask 0x01
    const control = getCharacteristics().control;
    if (control) {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    }
  };

  const handleResponse = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (!value) return;
    // CMD 0x29: Device notification when entering advertising mode
    if (value.getUint8(0) === 0x29) {
      // Check Byte 1 Bit 4 (0x10) to confirm active
      if (value.byteLength > 1 && value.getUint8(1) & 0x10) {
        setFindMyDeviceActive(true);
      }
    }
    // Device automatically exits mode on reconnect, so we reset state
    // when we receive CMD 0x01 (normal status updates)
    if (value.getUint8(0) === 0x01 && findMyDeviceActive()) {
      setFindMyDeviceActive(false);
    }
  };

  createEffect(() => {
    const control = getCharacteristics().control;
    if (!control) return;

    control.addEventListener("characteristicvaluechanged", handleResponse);

    onCleanup(() => {
      control.removeEventListener("characteristicvaluechanged", handleResponse);
    });
  });

  return {
    findMyDeviceActive,
    triggerFindMyDevice,
  };
}
