import { createEffect, createSignal } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { CharateristicUUIDs, States } from "../utils/uuids";
import { createCharateristicWithQueue } from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useVibration = () => {
  const [isVibrationOn, setIsVibrationOn] = createSignal<boolean>(false);
  const { getDeviceStateService, setCharacteristics } = useBluetooth();

  const handleCharacteristics = async () => {
    const service = getDeviceStateService();
    if (!service) return;
    const vibration = await createCharateristicWithQueue(
      service,
      CharateristicUUIDs.vibration,
      handleVibration
    );
    if(!vibration) {
      return Promise.reject("vibrationCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      vibration,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  const handleVibration = (value: DataView): void => {
    const convertedValue = convertBLEToUint16(value);
    const hasVibration = (convertedValue & States.VIBRATION) === 0;
    setIsVibrationOn(hasVibration);
  };

  return {
    isVibrationOn,
  };
};
