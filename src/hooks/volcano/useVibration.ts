import { createEffect, createSignal } from "solid-js";
import {
  convertBLEToUint16,
  convertToUInt32BLE,
} from "../../utils/bluetoothUtils";
import { CharateristicUUIDs, States } from "../../utils/uuids";
import { createCharateristic } from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "./useWriteToCharacteristic";

export const useVibration = () => {
  const [isVibrationOn, setIsVibrationOn] = createSignal<boolean>(false);
  const { getDeviceStateService, setCharacteristics } = useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

  const handleCharacteristics = async () => {
    const service = getDeviceStateService();
    if (!service) return;
    const vibration = await createCharateristic(
      service,
      CharateristicUUIDs.vibration,
      handleVibration
    );
    if (!vibration) {
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

  const setVibrationOn = async () => {
    await writeValueToCharacteristic(
      "vibration",
      States.VIBRATION,
      convertToUInt32BLE
    );
    setIsVibrationOn(true);
  };

  const setVibrationOff = async () => {
    await writeValueToCharacteristic(
      "vibration",
      0x10000 + States.VIBRATION,
      convertToUInt32BLE
    );
    setIsVibrationOn(false);
  };

  const handleVibration = (value: DataView): void => {
    const convertedValue = convertBLEToUint16(value);
    const hasVibration = (convertedValue & States.VIBRATION) === 0;
    setIsVibrationOn(hasVibration);
  };

  return {
    isVibrationOn,
    setVibrationOn,
    setVibrationOff,
  };
};
