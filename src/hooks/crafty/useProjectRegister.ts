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

interface UseProjectRegisterProps {
  isOldCrafty?: () => boolean;
}

export const useProjectRegister = (props?: UseProjectRegisterProps) => {
  const [getProjectRegister, setProjectRegister] = createSignal(0);
  const [isInitialized, setIsInitialized] = createSignal(false);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();
  const isOldDevice = props?.isOldCrafty || (() => false);

  const handleProjectRegister = (value: DataView) => {
    const register = convertBLEToUint16(value);
    setProjectRegister(register);
  };

  const handleCharacteristics = async () => {
    const service = getCraftyControlService();
    if (!service || isInitialized()) return;

    console.log(`useProjectRegister: Starting initialization (isOldCrafty: ${isOldDevice()})`);

    // Project register is available on all Crafty devices
    // On old Crafty, we only read the value without notifications
    // On Crafty+, we enable notifications
    if (isOldDevice()) {
      // Old Crafty: only read, no notifications
      try {
        const projectRegisterChar = await service.getCharacteristic(
          CraftyCharacteristicUUIDs.handleProjectRegister
        );
        if (projectRegisterChar) {
          const value = await projectRegisterChar.readValue();
          handleProjectRegister(value);
          setCharacteristics((prev) => ({
            ...prev,
            projectRegister: projectRegisterChar,
          }));
        }
      } catch (error) {
        console.error("Failed to read project register", error);
        return Promise.reject("handleProjectRegisterCharacteristic not found");
      }
    } else {
      // Crafty+: enable notifications
      const projectRegisterChar = await createCharateristicWithEventListener(
        service,
        CraftyCharacteristicUUIDs.handleProjectRegister,
        handleProjectRegister
      );
      if (!projectRegisterChar) {
        return Promise.reject("handleProjectRegisterCharacteristic not found");
      }
      setCharacteristics((prev) => ({
        ...prev,
        projectRegister: projectRegisterChar,
      }));

      // sicherheitscode is write-only and only available on Crafty+
      try {
        const sicherheitscode = await service.getCharacteristic(
          CraftyCharacteristicUUIDs.sicherheitscode
        );
        if (sicherheitscode) {
          setCharacteristics((prev) => ({
            ...prev,
            sicherheitscode,
          }));
        }
      } catch (error) {
        console.warn("Sicherheitscode characteristic not available", error);
      }
    }
    
    setIsInitialized(true);
    console.log("useProjectRegister: Initialization complete");
  };

  const setSicherheitscode = async (value: number) => {
    await writeValueToCharacteristic(
      "sicherheitscode",
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
      console.log(`useProjectRegister: Initializing (isOldCrafty: ${oldDevice})`);
      handleCharacteristics();
    }
  });

  onCleanup(() => {
    const { projectRegister } = getCharacteristics();
    if (projectRegister) {
      detachEventListener(projectRegister, handleProjectRegister);
    }
  });

  return {
    getProjectRegister,
    setSicherheitscode,
    handleCharacteristics,
  };
};
