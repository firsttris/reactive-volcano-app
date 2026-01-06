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

interface UseSettingsProps {
  isOldCrafty?: () => boolean;
}

export const useSettings = (props?: UseSettingsProps) => {
  const [getLedBrightness, setLedBrightness] = createSignal(0);
  const [getAutoOffCountdown, setAutoOffCountdown] = createSignal(0);
  const [getAutoOffCurrentValue, setAutoOffCurrentValue] = createSignal(0);
  const [isInitialized, setIsInitialized] = createSignal(false);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();
  const isOldDevice = props?.isOldCrafty || (() => false);

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
    if (!service || isInitialized()) return;

    console.log(`useSettings: Starting initialization (isOldCrafty: ${isOldDevice()})`);

    // LED brightness is available on all Crafty devices
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

    // Auto-off features only available on Crafty+ (firmware >= 2.51)
    if (!isOldDevice()) {
      try {
        const autoOffCountdown = await createCharateristicWithEventListener(
          service,
          CraftyCharacteristicUUIDs.autoOffCountdown,
          handleAutoOffCountdown
        );
        if (autoOffCountdown) {
          setCharacteristics((prev) => ({
            ...prev,
            autoOffCountdown,
          }));
        }

        const autoOffCurrentValue = await createCharateristicWithEventListener(
          service,
          CraftyCharacteristicUUIDs.autoOffCurrentValue,
          handleAutoOffCurrentValue
        );
        if (autoOffCurrentValue) {
          setCharacteristics((prev) => ({
            ...prev,
            autoOffCurrentValue,
          }));
        }
      } catch (error) {
        console.warn("Auto-off features not available (old Crafty)", error);
      }
    }
    
    setIsInitialized(true);
    console.log("useSettings: Initialization complete");
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
    // Wait for firmware detection before initializing
    // This ensures isOldCrafty is set correctly
    const oldDevice = isOldDevice();
    const service = getCraftyControlService();
    
    // Only proceed if service is available
    if (service) {
      console.log(`useSettings: Initializing (isOldCrafty: ${oldDevice})`);
      handleCharacteristics();
    }
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
