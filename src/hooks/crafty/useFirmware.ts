import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  createCharateristic,
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
  const { getCraftyDeviceInfoService, getCraftyStatusService, getCharacteristics, setCharacteristics } =
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
    // BLE firmware version is 3 bytes: major.minor.patch
    // e.g., [1, 2, 3] -> "V1.2.3"
    if (value.byteLength >= 3) {
      const major = value.getUint8(0);
      const minor = value.getUint8(1);
      const patch = value.getUint8(2);
      setFirmwareBLEVersion(`V${major}.${minor}.${patch}`);
    } else {
      // Fallback for unexpected format
      const version = convertBLEToUint16(value);
      setFirmwareBLEVersion(version.toString());
    }
  };

  const handleStatusRegister2 = (value: DataView) => {
    const status = convertBLEToUint16(value);
    setStatusRegister2(status);
  };

  const handleCharacteristics = async () => {
    // Firmware version is in Crafty2 (DeviceInfo service)
    const deviceInfoService = getCraftyDeviceInfoService();
    // Status register is in Crafty3 (Status service)
    const statusService = getCraftyStatusService();
    
    if (!deviceInfoService || !statusService) return;

    // First get firmware version to determine device capabilities
    // firmwareVersion (0x32) is in Crafty2 service
    // NOTE: This characteristic does NOT support notifications - use createCharateristic (read-only)
    const firmwareVersion = await createCharateristic(
      deviceInfoService,
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
    // firmwareBLEVersion (0x72) is also in Crafty2 service
    // NOTE: This characteristic does NOT support notifications - use createCharateristic (read-only)
    if (!isOldCrafty()) {
      try {
        const firmwareBLEVersion = await createCharateristic(
          deviceInfoService,
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

    // statusRegister2 (0x1c3) is in Crafty3 service
    const statusRegister2 = await createCharateristicWithEventListener(
      statusService,
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
    const { statusRegister2 } = getCharacteristics();
    // Only statusRegister2 uses notifications
    // firmwareVersion and firmwareBLEVersion are read-only (no notifications)
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
