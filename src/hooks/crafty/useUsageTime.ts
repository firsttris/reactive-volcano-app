import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";

interface UseUsageTimeProps {
  isOldCrafty?: () => boolean;
}

export const useUsageTime = (props?: UseUsageTimeProps) => {
  const [getUseHours, setUseHours] = createSignal(0);
  const [getUseMinutes, setUseMinutes] = createSignal(0);
  const [isInitialized, setIsInitialized] = createSignal(false);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const isOldDevice = props?.isOldCrafty || (() => false);

  const handleUseHours = (value: DataView) => {
    const hours = convertBLEToUint16(value);
    setUseHours(hours);
  };

  const handleUseMinutes = (value: DataView) => {
    const minutes = convertBLEToUint16(value);
    setUseMinutes(minutes);
  };

  const handleCharacteristics = async () => {
    const service = getCraftyControlService();
    if (!service || isInitialized()) return;

    console.log(`useUsageTime: Starting initialization (isOldCrafty: ${isOldDevice()})`);

    // Hours are available on all Crafty devices
    const useHoursCharacteristic = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.useHoursCharacteristic,
      handleUseHours
    );
    if (!useHoursCharacteristic) {
      return Promise.reject("useHoursCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      useHoursCharacteristic,
    }));

    // Minutes only available on Crafty+ (firmware >= 2.51)
    if (!isOldDevice()) {
      try {
        const useMinutesCharacteristic = await createCharateristicWithEventListener(
          service,
          CraftyCharacteristicUUIDs.useMinutesCharacteristic,
          handleUseMinutes
        );
        if (useMinutesCharacteristic) {
          setCharacteristics((prev) => ({
            ...prev,
            useMinutesCharacteristic,
          }));
        }
      } catch (error) {
        console.warn("Usage minutes not available (old Crafty)", error);
        // Old Crafty only provides hours, so minutes remain 0
      }
    }
    
    setIsInitialized(true);
    console.log("useUsageTime: Initialization complete");
  };

  createEffect(() => {
    // Wait for firmware detection before initializing
    // This ensures isOldCrafty is set correctly
    const oldDevice = isOldDevice();
    const service = getCraftyControlService();
    
    // Only proceed if service is available
    if (service) {
      console.log(`useUsageTime: Initializing (isOldCrafty: ${oldDevice})`);
      handleCharacteristics();
    }
  });

  onCleanup(() => {
    const { useHoursCharacteristic, useMinutesCharacteristic } =
      getCharacteristics();
    if (useHoursCharacteristic) {
      detachEventListener(useHoursCharacteristic, handleUseHours);
    }
    if (useMinutesCharacteristic) {
      detachEventListener(useMinutesCharacteristic, handleUseMinutes);
    }
  });

  return {
    getUseHours,
    getUseMinutes,
    handleCharacteristics,
  };
};
