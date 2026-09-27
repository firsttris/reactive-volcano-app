import { createEffect, createSignal, onCleanup } from "solid-js";
import {
  convertBLEToUint16,
  convertToUInt16BLE,
} from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
  getCharacteristic,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "../volcano/useWriteToCharacteristic";

interface UsePowerProps {
  isOldCrafty?: () => boolean;
  isFirmwareLoaded?: () => boolean;
}

export const usePower = (props?: UsePowerProps) => {
  const [getPowerChanged, setPowerChanged] = createSignal(0);
  const [getBatteryPercent, setBatteryPercent] = createSignal(0);
  const [isInitialized, setIsInitialized] = createSignal(false);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();
  const isOldDevice = props?.isOldCrafty || (() => false);
  const isFirmwareLoaded = props?.isFirmwareLoaded || (() => true);

  const handlePowerChanged = (value: DataView) => {
    const power = convertBLEToUint16(value);
    setPowerChanged(power);
    // The powerChanged characteristic (0x41) contains battery percentage
    // This is available on all Crafty devices (both old and new)
    setBatteryPercent(power);
    console.log("Crafty Power: Battery percentage updated to", power);
  };

  const handleCharacteristics = async () => {
    const service = getCraftyControlService();
    if (!service || isInitialized()) return;

    console.log(
      `usePower: Starting initialization (isOldCrafty: ${isOldDevice()})`
    );

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
        const heaterOn = await getCharacteristic(
          service,
          CraftyCharacteristicUUIDs.heaterOn
        );
        if (heaterOn) {
          setCharacteristics((prev) => ({
            ...prev,
            heaterOn,
          }));
        }

        const heaterOff = await getCharacteristic(
          service,
          CraftyCharacteristicUUIDs.heaterOff
        );
        if (heaterOff) {
          setCharacteristics((prev) => ({
            ...prev,
            heaterOff,
          }));
        }
      } catch (error) {
        console.warn(
          "Heater on/off controls not available (old Crafty)",
          error
        );
      }
    }

    setIsInitialized(true);
    console.log("usePower: Initialization complete");
  };

  // The original app writes a 2-byte zero value to heaterOn/heaterOff
  const turnHeaterOn = async () => {
    await writeValueToCharacteristic("heaterOn", 0, convertToUInt16BLE);
  };

  const turnHeaterOff = async () => {
    await writeValueToCharacteristic("heaterOff", 0, convertToUInt16BLE);
  };

  createEffect(() => {
    // Wait for firmware detection before initializing
    // This ensures isOldCrafty is set correctly
    const oldDevice = isOldDevice();
    const service = getCraftyControlService();

    // Only proceed if service is available and the firmware version is known
    if (service && isFirmwareLoaded()) {
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
    getBatteryPercent,
    turnHeaterOn,
    turnHeaterOff,
    handleCharacteristics,
  };
};
