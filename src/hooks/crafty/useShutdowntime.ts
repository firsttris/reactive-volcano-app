import { createEffect, createSignal, onCleanup } from "solid-js";
import {
  convertBLEToUint16,
  convertToUInt16BLE,
} from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "./useWriteToCharacteristic";

export const useShutdowntime = () => {
  const [getShutdowntime, setShutdowntime] = createSignal(0);
  const [getCurrentShutdowntime, setCurrentShutdowntime] = createSignal(0);
  const { getCraftyService1, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

  const handleAutoOffCountdown = (value: DataView) => {
    const shutdowntime = convertBLEToUint16(value);
    setShutdowntime(shutdowntime);
  };

  const handleAutoOffCurrentValue = (value: DataView) => {
    const currentShutdowntime = convertBLEToUint16(value);
    setCurrentShutdowntime(currentShutdowntime);
  };

  const handleCharacteristics = async () => {
    const service = getCraftyService1();
    if (!service) return;

    // Auto-off countdown (set value)
    const autoOffCountdown = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.autoOffCountdown,
      handleAutoOffCountdown
    );
    if (!autoOffCountdown) {
      return Promise.reject("autoOffCountdownCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      autoOffCountdown,
    }));

    // Current auto-off value (current countdown)
    const autoOffCurrentValue = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.autoOffCurrentValue,
      handleAutoOffCurrentValue
    );
    if (!autoOffCurrentValue) {
      return Promise.reject("autoOffCurrentValueCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      autoOffCurrentValue,
    }));
  };

  const setShutdowntimeValue = async (value: number) => {
    const characteristic = getCharacteristics().autoOffCountdown;
    if (characteristic) {
      const buffer = convertToUInt16BLE(value);
      await writeValueToCharacteristic(characteristic, buffer);
    }
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const characteristics = getCharacteristics();
    if (characteristics.autoOffCountdown) {
      detachEventListener(
        characteristics.autoOffCountdown,
        handleAutoOffCountdown
      );
    }
    if (characteristics.autoOffCurrentValue) {
      detachEventListener(
        characteristics.autoOffCurrentValue,
        handleAutoOffCurrentValue
      );
    }
  });

  return {
    getShutdowntime,
    getCurrentShutdowntime,
    setShutdowntime: setShutdowntimeValue,
  };
};
