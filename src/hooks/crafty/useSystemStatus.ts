import { createEffect, createSignal } from "solid-js";
import {
  convertBLEToUint16,
  convertToUInt8BLE,
} from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import { createCharateristic } from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "../volcano/useWriteToCharacteristic";

interface UseSystemStatusProps {
  isOldCrafty?: () => boolean;
}

export const useSystemStatus = (props?: UseSystemStatusProps) => {
  const [getSystemStatus, setSystemStatus] = createSignal(0);
  const [getAkkuStatus, setAkkuStatus] = createSignal(0);
  const [getAkkuStatus2, setAkkuStatus2] = createSignal(0);
  const [isInitialized, setIsInitialized] = createSignal(false);
  const { getCraftyStatusService, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();
  const isOldDevice = props?.isOldCrafty || (() => false);

  const handleSystemStatus = (value: DataView) => {
    const status = convertBLEToUint16(value);
    setSystemStatus(status);
  };

  const handleAkkuStatus = (value: DataView) => {
    const status = convertBLEToUint16(value);
    setAkkuStatus(status);
  };

  const handleAkkuStatus2 = (value: DataView) => {
    const status = convertBLEToUint16(value);
    setAkkuStatus2(status);
  };

  const handleCharacteristics = async () => {
    // systemStatus (0x83), akkuStatus (0x63, 0x73), factoryReset (0x1d3) are in Crafty3 (Status service)
    const service = getCraftyStatusService();
    if (!service || isInitialized()) return;

    // System status features only available on Crafty+ (firmware >= 2.51)
    if (isOldDevice()) {
      console.log("System status features not available on old Crafty");
      setIsInitialized(true);
      return;
    }

    console.log(`useSystemStatus: Starting initialization (isOldCrafty: ${isOldDevice()})`);

    try {
      // NOTE: These characteristics do NOT support notifications - use createCharateristic (read-only)
      const systemStatusCharacteristic = await createCharateristic(
        service,
        CraftyCharacteristicUUIDs.systemStatusCharacteristic,
        handleSystemStatus
      );
      if (systemStatusCharacteristic) {
        setCharacteristics((prev) => ({
          ...prev,
          systemStatusCharacteristic,
        }));
      }

      const akkuStatusCharacteristic = await createCharateristic(
        service,
        CraftyCharacteristicUUIDs.akkuStatusCharacteristic,
        handleAkkuStatus
      );
      if (akkuStatusCharacteristic) {
        setCharacteristics((prev) => ({
          ...prev,
          akkuStatusCharacteristic,
        }));
      }

      const akkuStatusCharacteristic2 = await createCharateristic(
        service,
        CraftyCharacteristicUUIDs.akkuStatusCharacteristic2,
        handleAkkuStatus2
      );
      if (akkuStatusCharacteristic2) {
        setCharacteristics((prev) => ({
          ...prev,
          akkuStatusCharacteristic2,
        }));
      }

      // factoryResetCharacteristic is write-only
      const factoryResetCharacteristic = await service.getCharacteristic(
        CraftyCharacteristicUUIDs.factoryResetCharacteristic
      );
      if (factoryResetCharacteristic) {
        setCharacteristics((prev) => ({
          ...prev,
          factoryResetCharacteristic,
        }));
      }
    } catch (error) {
      console.warn("System status features not fully available", error);
    }
    
    setIsInitialized(true);
    console.log("useSystemStatus: Initialization complete");
  };

  const factoryReset = async () => {
    await writeValueToCharacteristic(
      "factoryResetCharacteristic",
      0,
      convertToUInt8BLE
    );
  };

  createEffect(() => {
    // Wait for firmware detection before initializing
    // This ensures isOldCrafty is set correctly
    const oldDevice = isOldDevice();
    const service = getCraftyStatusService();
    
    // Only proceed if service is available
    if (service) {
      console.log(`useSystemStatus: Initializing (isOldCrafty: ${oldDevice})`);
      handleCharacteristics();
    }
  });

  // No onCleanup needed - system status characteristics don't use notifications

  return {
    getSystemStatus,
    getAkkuStatus,
    getAkkuStatus2,
    factoryReset,
    handleCharacteristics,
  };
};
