import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";

export const useHeatingTime = () => {
  const [getHeatingHours, setHeatingHours] = createSignal(0);
  const [getHeatingMinutes, setHeatingMinutes] = createSignal(0);
  const { getCraftyService3, getCharacteristics, setCharacteristics } =
    useBluetooth();

  const handleUseHours = (value: DataView) => {
    const hours = convertBLEToUint16(value);
    setHeatingHours(hours);
  };

  const handleUseMinutes = (value: DataView) => {
    const minutes = convertBLEToUint16(value);
    setHeatingMinutes(minutes);
  };

  const handleCharacteristics = async () => {
    const service = getCraftyService3();
    if (!service) return;

    // Heating hours
    const useHours = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.useHours,
      handleUseHours
    );
    if (!useHours) {
      return Promise.reject("useHoursCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      useHours,
    }));

    // Heating minutes
    const useMinutes = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.useMinutes,
      handleUseMinutes
    );
    if (!useMinutes) {
      return Promise.reject("useMinutesCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      useMinutes,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const characteristics = getCharacteristics();
    if (characteristics.useHours) {
      detachEventListener(characteristics.useHours, handleUseHours);
    }
    if (characteristics.useMinutes) {
      detachEventListener(characteristics.useMinutes, handleUseMinutes);
    }
  });

  return {
    getHeatingHours,
    getHeatingMinutes,
  };
};
