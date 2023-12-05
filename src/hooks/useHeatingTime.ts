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
  const { getService4, getCharacteristics, setCharacteristics } = useBluetooth();

  const handleCharacteristics = async () => {
    const service = getService4();
    if (!service) return;
    const hoursOfHeating = await createCharateristicWithEventListener(
      service,
      CharateristicUUIDs.hoursOfHeating,
      handleHoursOfHeating
    );
    const minutesOfHeating = await createCharateristicWithEventListener(
      service,
      CharateristicUUIDs.minutesOfHeating,
      handleMinutesOfHeating
    );
    setCharacteristics((prev) => ({
      ...prev,
      hoursOfHeating,
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
