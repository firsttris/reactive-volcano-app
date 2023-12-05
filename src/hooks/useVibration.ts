import { createEffect, createSignal } from "solid-js";
import { convertBLEToUint16 } from "../utils/bluetoothUtils";
import { CharateristicUUIDs, States } from "../utils/uuids";
import { createCharateristic } from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";

export const useVibration = () => {
  const [isVibrationOn, setIsVibrationOn] = createSignal<boolean>(false);
  const { getService3, setCharacteristics } = useBluetooth();

  const handleCharacteristics = async () => {
    const service = getService3();
    if (!service) return;
    const vibration = await createCharateristic(
      service,
      CharateristicUUIDs.vibration,
      handleVibration
    );
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
