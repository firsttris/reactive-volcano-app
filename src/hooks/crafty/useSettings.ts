import { createEffect, createSignal, onCleanup } from "solid-js";
import {
  convertBLEToUint16,
  convertToUInt16BLE,
} from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "../volcano/useWriteToCharacteristic";

export const useSettings = () => {
  const [getLedBrightness, setLedBrightness] = createSignal(0);
  const [getAutoOffCountdown, setAutoOffCountdown] = createSignal(0);
  const [getAutoOffCurrentValue, setAutoOffCurrentValue] = createSignal(0);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

  const handleLedBrightness = (value: DataView) => {
    const brightness = convertBLEToUint16(value);
    setLedBrightness(brightness);
  };

  const handleAutoOffCountdown = (value: DataView) => {
    const countdown = convertBLEToUint16(value);
    setAutoOffCountdown(countdown);
  };

  const handleAutoOffCurrentValue = (value: DataView) => {
    const currentValue = convertBLEToUint16(value);
    setAutoOffCurrentValue(currentValue);
  };

  const handleCharacteristics = async () => {
    const service = getCraftyControlService();
    if (!service) return;

    const ledBrightness = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.ledBrightness,
      handleLedBrightness
    );
    if (!ledBrightness) {
      return Promise.reject("ledBrightnessCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      ledBrightness,
    }));

    const autoOffCountdown = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.autoOffCountdown,
      handleAutoOffCountdown
    );
    if (!autoOffCountdown) {
      return Promise.reject("autoOffCountdownCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      autoOffCountdown,
    }));

    const autoOffCurrentValue = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.autoOffCurrentValue,
      handleAutoOffCurrentValue
    );
    if (!autoOffCurrentValue) {
      return Promise.reject("autoOffCurrentValueCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      autoOffCurrentValue,
    }));
  };

  const setLedBrightnessValue = async (value: number) => {
    await writeValueToCharacteristic(
      "ledBrightness",
      value,
      convertToUInt16BLE
    );
  };

  const setAutoOffCountdownValue = async (value: number) => {
    await writeValueToCharacteristic(
      "autoOffCountdown",
      value,
      convertToUInt16BLE
    );
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { ledBrightness, autoOffCountdown, autoOffCurrentValue } =
      getCharacteristics();
    if (ledBrightness) {
      detachEventListener(ledBrightness, handleLedBrightness);
    }
    if (autoOffCountdown) {
      detachEventListener(autoOffCountdown, handleAutoOffCountdown);
    }
    if (autoOffCurrentValue) {
      detachEventListener(autoOffCurrentValue, handleAutoOffCurrentValue);
    }
  });

  return {
    getLedBrightness,
    getAutoOffCountdown,
    getAutoOffCurrentValue,
    setLedBrightness: setLedBrightnessValue,
    setAutoOffCountdown: setAutoOffCountdownValue,
    handleCharacteristics,
  };
};
