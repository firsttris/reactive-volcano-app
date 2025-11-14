import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";

export const useUsageTime = () => {
  const [getUseHours, setUseHours] = createSignal(0);
  const [getUseMinutes, setUseMinutes] = createSignal(0);
  const { getDeviceControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();

  const handleUseHours = (value: DataView) => {
    const hours = convertBLEToUint16(value);
    setUseHours(hours);
  };

  const handleUseMinutes = (value: DataView) => {
    const minutes = convertBLEToUint16(value);
    setUseMinutes(minutes);
  };

  const handleCharacteristics = async () => {
    const service = getDeviceControlService();
    if (!service) return;

    const useHoursCharacteristic = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.useHoursCharacteristic,
      handleUseHours
    );
    if (!useHoursCharacteristic) {
      return Promise.reject("useHoursCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      useHoursCharacteristic,
    }));

    const useMinutesCharacteristic = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.useMinutesCharacteristic,
      handleUseMinutes
    );
    if (!useMinutesCharacteristic) {
      return Promise.reject("useMinutesCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      useMinutesCharacteristic,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { useHoursCharacteristic, useMinutesCharacteristic } =
      getCharacteristics();
    if (useHoursCharacteristic) {
      detachEventListener(useHoursCharacteristic, handleUseHours);
    }
    if (useMinutesCharacteristic) {
      detachEventListener(useMinutesCharacteristic, handleUseMinutes);
    }
  });

  return {
    getUseHours,
    getUseMinutes,
    handleCharacteristics,
  };
};
