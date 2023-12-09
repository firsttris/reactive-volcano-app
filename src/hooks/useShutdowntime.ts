import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { CharateristicUUIDs } from "../utils/uuids";
import {
  createCharateristicWithEventListenerWithQueue,
  detachEventListenerWithQueue,
  createCharateristicWithQueue,
} from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useShutdowntime = () => {
  const [getAutoOffTimeInSec, setAutoOffTime] = createSignal<number>(0);
  const [getShutoffTimeInSec, setShutoffTime] = createSignal<number>(0);
  const { getDeviceControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();

  const handleCharacteristics = async () => {
    const controlService = getDeviceControlService();
    if (!controlService) return;
    const shutoffTime = await createCharateristicWithQueue(
      controlService,
      CharateristicUUIDs.shutoffTime,
      handleShutoffTime
    );
    if(!shutoffTime) {
      return Promise.reject("shutoffTimeCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      shutoffTime,
    }));
    const currentAutoOffValue = await createCharateristicWithEventListenerWithQueue(
      controlService,
      CharateristicUUIDs.currentAutoOffValue,
      handleAutoOffTimeInSec
    );
    if(!currentAutoOffValue) {
      return Promise.reject("currentAutoOffValueCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      currentAutoOffValue,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { currentAutoOffValue } = getCharacteristics();
    if (currentAutoOffValue) {
      detachEventListenerWithQueue(currentAutoOffValue, handleAutoOffTimeInSec);
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
