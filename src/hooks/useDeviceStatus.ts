import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { CharateristicUUIDs, States } from "../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useDeviceStatus = () => {
  const [isHeatingActive, setIsHeatingActive] = createSignal<boolean>(false);
  const [isPumpActive, setIsPumpActive] = createSignal<boolean>(false);
  const [isAutoShutdownActive, setIsAutoShutdownActive] =
    createSignal<boolean>(false);
  const { getService3, getCharacteristics, setCharacteristics } =
    useBluetooth();

  const handleCharacteristics = async () => {
    const service = getService3();
    if (!service) return;
    const activity = await createCharateristicWithEventListener(
      service,
      CharateristicUUIDs.activity,
      handleActivity
    );
    setCharacteristics((prev) => ({
      ...prev,
      activity,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { activity } = getCharacteristics();
    if (activity) {
      detachEventListener(activity, handleActivity);
    }
  });

  const handleActivity = (value: DataView): void => {
    const convertedValue = convertBLEToUint16(value);
    const isHeatingActive = (convertedValue & States.HEIZUNG_ENA) !== 0;
    setIsHeatingActive(isHeatingActive);
    const isPumpActive = (convertedValue & States.PUMPE_FET_ENABLE) !== 0;
    setIsPumpActive(isPumpActive);
    const isAutoshutdownActive =
      (convertedValue & States.ENABLE_AUTOBLESHUTDOWN) !== 0;
    setIsAutoShutdownActive(isAutoshutdownActive);
  };

  return {
    isHeatingActive,
    isPumpActive,
    isAutoShutdownActive,
  };
};
