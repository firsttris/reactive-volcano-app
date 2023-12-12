import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { CharateristicUUIDs } from "../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useHeatingTime = () => {
  const [getHoursOfHeating, setHoursOfHeating] = createSignal<number>(0);
  const [getMinutesOfHeating, setMinutesOfHeating] = createSignal<number>(0);
  const { getDeviceControlService, getCharacteristics, setCharacteristics } = useBluetooth();

  const handleCharacteristics = async () => {
    const controlService = getDeviceControlService();
    if (!controlService) return;
    const hoursOfHeating = await createCharateristicWithEventListener(
      controlService,
      CharateristicUUIDs.hoursOfHeating,
      handleHoursOfHeating
    );
    if(!hoursOfHeating) {
      return Promise.reject("hoursOfHeatingCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      hoursOfHeating,
    }));
    const minutesOfHeating = await createCharateristicWithEventListener(
      controlService,
      CharateristicUUIDs.minutesOfHeating,
      handleMinutesOfHeating
    );
    if(!minutesOfHeating) {
      return Promise.reject("minutesOfHeatingCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      minutesOfHeating,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { hoursOfHeating, minutesOfHeating } = getCharacteristics();
    if (hoursOfHeating) {
      detachEventListener(hoursOfHeating, handleHoursOfHeating);
    }
    if (minutesOfHeating) {
      detachEventListener(minutesOfHeating, handleMinutesOfHeating);
    }
  });

  const handleHoursOfHeating = (value: DataView) =>
    handleHours(value, "HoursOfHeating");
  const handleMinutesOfHeating = (value: DataView) =>
    handleHours(value, "MinutesOfHeating");

  const handleHours = (
    value: DataView,
    field: "HoursOfHeating" | "MinutesOfHeating"
  ): void => {
    const convertedValue = convertBLEToUint16(value);
    if (field === "HoursOfHeating") {
      setHoursOfHeating(convertedValue);
    } else if (field === "MinutesOfHeating") {
      setMinutesOfHeating(convertedValue);
    }
  };

  return {
    getHoursOfHeating,
    getMinutesOfHeating,
  };
};
