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

interface UseSystemStatusProps {
  isOldCrafty?: () => boolean;
}

export const useSystemStatus = (props?: UseSystemStatusProps) => {
  const [getSystemStatus, setSystemStatus] = createSignal(0);
  const [getAkkuStatus, setAkkuStatus] = createSignal(0);
  const [getAkkuStatus2, setAkkuStatus2] = createSignal(0);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
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
    const service = getCraftyControlService();
    if (!service) return;

    // System status features only available on Crafty+ (firmware >= 2.51)
    if (isOldDevice()) {
      console.log("System status features not available on old Crafty");
      return;
    }

    try {
      const systemStatusCharacteristic =
        await createCharateristicWithEventListener(
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

      const akkuStatusCharacteristic = await createCharateristicWithEventListener(
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

      const akkuStatusCharacteristic2 =
        await createCharateristicWithEventListener(
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
  };

  const factoryReset = async () => {
    await writeValueToCharacteristic(
      "factoryResetCharacteristic",
      0,
      convertToUInt8BLE
    );
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const {
      systemStatusCharacteristic,
      akkuStatusCharacteristic,
      akkuStatusCharacteristic2,
    } = getCharacteristics();
    if (systemStatusCharacteristic) {
      detachEventListener(systemStatusCharacteristic, handleSystemStatus);
    }
    if (akkuStatusCharacteristic) {
      detachEventListener(akkuStatusCharacteristic, handleAkkuStatus);
    }
    if (akkuStatusCharacteristic2) {
      detachEventListener(akkuStatusCharacteristic2, handleAkkuStatus2);
    }
  });

  return {
    getSystemStatus,
    getAkkuStatus,
    getAkkuStatus2,
    factoryReset,
    handleCharacteristics,
  };
};
