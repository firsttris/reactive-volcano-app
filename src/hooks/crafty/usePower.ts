import { createEffect, createSignal, onCleanup } from "solid-js";
import {
  convertBLEToUint16,
  convertToUInt8BLE,
} from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "../volcano/useWriteToCharacteristic";

interface UsePowerProps {
  isOldCrafty?: () => boolean;
}

export const usePower = (props?: UsePowerProps) => {
  const [getPowerChanged, setPowerChanged] = createSignal(0);
  const [isInitialized, setIsInitialized] = createSignal(false);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();
  const isOldDevice = props?.isOldCrafty || (() => false);

  const handlePowerChanged = (value: DataView) => {
    const power = convertBLEToUint16(value);
    setPowerChanged(power);
  };

  const handleCharacteristics = async () => {
    const service = getCraftyControlService();
    if (!service || isInitialized()) return;

    console.log(`usePower: Starting initialization (isOldCrafty: ${isOldDevice()})`);

    // Power characteristic is available on all Crafty devices
    const powerChanged = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.powerChanged,
      handlePowerChanged
    );
    if (!powerChanged) {
      return Promise.reject("powerChangedCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      powerChanged,
    }));

    // heaterOn and heaterOff only available on Crafty+ (firmware >= 2.51)
    if (!isOldDevice()) {
      try {
        const heaterOn = await service.getCharacteristic(
          CraftyCharacteristicUUIDs.heaterOn
        );
        if (heaterOn) {
          setCharacteristics((prev) => ({
            ...prev,
            heaterOn,
          }));
        }

        const heaterOff = await service.getCharacteristic(
          CraftyCharacteristicUUIDs.heaterOff
        );
        if (heaterOff) {
          setCharacteristics((prev) => ({
            ...prev,
            heaterOff,
          }));
        }
      } catch (error) {
        console.warn("Heater on/off controls not available (old Crafty)", error);
      }
    }
    
    setIsInitialized(true);
    console.log("usePower: Initialization complete");
  };

  const turnHeaterOn = async () => {
    await writeValueToCharacteristic("heaterOn", 1, convertToUInt8BLE);
  };

  const turnHeaterOff = async () => {
    await writeValueToCharacteristic("heaterOff", 1, convertToUInt8BLE);
  };

  createEffect(() => {
    // Wait for firmware detection before initializing
    // This ensures isOldCrafty is set correctly
    const oldDevice = isOldDevice();
    const service = getCraftyControlService();
    
    // Only proceed if service is available
    if (service) {
      console.log(`usePower: Initializing (isOldCrafty: ${oldDevice})`);
      handleCharacteristics();
    }
  });

  onCleanup(() => {
    const { powerChanged } = getCharacteristics();
    if (powerChanged) {
      detachEventListener(powerChanged, handlePowerChanged);
    }
  });

  return {
    getPowerChanged,
    turnHeaterOn,
    turnHeaterOff,
    handleCharacteristics,
  };
};
