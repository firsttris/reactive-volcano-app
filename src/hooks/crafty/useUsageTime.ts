import { createEffect, createSignal } from "solid-js";
import { convertBLEToUint16 } from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import { createCharateristic } from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";

interface UseUsageTimeProps {
  isOldCrafty?: () => boolean;
}

export const useUsageTime = (props?: UseUsageTimeProps) => {
  const [getUseHours, setUseHours] = createSignal(0);
  const [getUseMinutes, setUseMinutes] = createSignal(0);
  const [isInitialized, setIsInitialized] = createSignal(false);
  const { getCraftyStatusService, setCharacteristics } =
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
    // useHours (0x23) and useMinutes (0x1e3) are in Crafty3 (Status service)
    const service = getCraftyStatusService();
    if (!service || isInitialized()) return;

    console.log(`useUsageTime: Starting initialization (isOldCrafty: ${isOldDevice()})`);

    // Hours are available on all Crafty devices
    // NOTE: This characteristic does NOT support notifications - use createCharateristic (read-only)
    const useHoursCharacteristic = await createCharateristic(
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
    // NOTE: This characteristic does NOT support notifications - use createCharateristic (read-only)
    if (!isOldDevice()) {
      try {
        const useMinutesCharacteristic = await createCharateristic(
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
    const service = getCraftyStatusService();
    
    // Only proceed if service is available
    if (service) {
      console.log(`useUsageTime: Initializing (isOldCrafty: ${oldDevice})`);
      handleCharacteristics();
    }
  });

  // No onCleanup needed - useHours and useMinutes don't use notifications

  return {
    getUseHours,
    getUseMinutes,
    handleCharacteristics,
  };
};
