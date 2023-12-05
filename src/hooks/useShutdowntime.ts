import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { CharateristicUUIDs } from "../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
  createCharateristic,
} from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useShutdowntime = () => {
  const [getAutoOffTimeInSec, setAutoOffTime] = createSignal<number>(0);
  const [getShutoffTimeInSec, setShutoffTime] = createSignal<number>(0);
  const { getService4, getCharacteristics, setCharacteristics } =
    useBluetooth();

  const handleCharacteristics = async () => {
    const serivce4 = getService4();
    if (!serivce4) return;
    const shutoffTime = await createCharateristic(
      serivce4,
      CharateristicUUIDs.shutoffTime,
      handleShutoffTime
    );
    const currentAutoOffValue = await createCharateristicWithEventListener(
      serivce4,
      CharateristicUUIDs.currentAutoOffValue,
      handleAutoOffTimeInSec
    );
    setCharacteristics((prev) => ({
      ...prev,
      currentAutoOffValue,
      shutoffTime,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { currentAutoOffValue } = getCharacteristics();
    if (currentAutoOffValue) {
      detachEventListener(currentAutoOffValue, handleAutoOffTimeInSec);
    }
  });

  const handleAutoOffTimeInSec = (value: DataView): void => {
    setAutoOffTime(convertBLEToUint16(value));
  };

  const handleShutoffTime = (value: DataView): void => {
    setShutoffTime(convertBLEToUint16(value));
  };

  return {
    getAutoOffTimeInSec,
    getShutoffTimeInSec,
  };
};
