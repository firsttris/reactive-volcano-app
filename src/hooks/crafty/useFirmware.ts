import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";

/**
 * Parse firmware version string (e.g., "V2.48" or "V3.01")
 * Returns { major, minor } or null if parsing fails
 */
const parseFirmwareVersion = (version: string): { major: number; minor: number } | null => {
  // Expected format: "V2.48" or "V3.01"
  const match = version.match(/V?(\d+)\.(\d+)/);
  if (!match) return null;
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10)
  };
};

/**
 * Check if firmware version indicates old Crafty (firmware <= 2.51)
 * Old Crafty devices don't support many BLE characteristics
 */
const isOldCraftyFirmware = (version: string): boolean => {
  const parsed = parseFirmwareVersion(version);
  if (!parsed) return false;
  
  // Old Crafty: firmware <= 2.51
  return parsed.major < 2 || (parsed.major === 2 && parsed.minor < 51);
};

export const useFirmware = () => {
  const [getFirmwareVersion, setFirmwareVersion] = createSignal("");
  const [getFirmwareBLEVersion, setFirmwareBLEVersion] = createSignal("");
  const [getStatusRegister2, setStatusRegister2] = createSignal(0);
  const [isOldCrafty, setIsOldCrafty] = createSignal(false);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();

  const handleFirmwareVersion = (value: DataView) => {
    const decoder = new TextDecoder("utf-8");
    const versionString = decoder.decode(value);
    setFirmwareVersion(versionString);
    
    // Check if this is an old Crafty device
    const isOld = isOldCraftyFirmware(versionString);
    setIsOldCrafty(isOld);
    
    if (isOld) {
      console.log(`Old Crafty detected (firmware: ${versionString}). Some features will be unavailable.`);
    }
  };

  const handleFirmwareBLEVersion = (value: DataView) => {
    const version = convertBLEToUint16(value);
    setFirmwareBLEVersion(version.toString());
  };

  const handleStatusRegister2 = (value: DataView) => {
    const status = convertBLEToUint16(value);
    setStatusRegister2(status);
  };

  const handleCharacteristics = async () => {
    const service = getCraftyControlService();
    if (!service) return;

    // First get firmware version to determine device capabilities
    const firmwareVersion = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.firmwareVersion,
      handleFirmwareVersion
    );
    if (!firmwareVersion) {
      return Promise.reject("firmwareVersionCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      firmwareVersion,
    }));

    // BLE firmware version only available on Crafty+ (firmware >= 2.51)
    if (!isOldCrafty()) {
      try {
        const firmwareBLEVersion = await createCharateristicWithEventListener(
          service,
          CraftyCharacteristicUUIDs.firmwareBLEVersion,
          handleFirmwareBLEVersion
        );
        if (firmwareBLEVersion) {
          setCharacteristics((prev) => ({
            ...prev,
            firmwareBLEVersion,
          }));
        }
      } catch (error) {
        console.warn("Firmware BLE version not available (old Crafty)", error);
      }
    }

    const statusRegister2 = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.statusRegister2,
      handleStatusRegister2
    );
    if (!statusRegister2) {
      return Promise.reject("statusRegister2Characteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      statusRegister2,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { firmwareVersion, firmwareBLEVersion, statusRegister2 } =
      getCharacteristics();
    if (firmwareVersion) {
      detachEventListener(firmwareVersion, handleFirmwareVersion);
    }
    if (firmwareBLEVersion) {
      detachEventListener(firmwareBLEVersion, handleFirmwareBLEVersion);
    }
    if (statusRegister2) {
      detachEventListener(statusRegister2, handleStatusRegister2);
    }
  });

  return {
    getFirmwareVersion,
    getFirmwareBLEVersion,
    getStatusRegister2,
    isOldCrafty,
    handleCharacteristics,
  };
};
