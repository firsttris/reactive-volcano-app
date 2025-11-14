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

export const useSystemStatus = () => {
  const [getSystemStatus, setSystemStatus] = createSignal(0);
  const [getAkkuStatus, setAkkuStatus] = createSignal(0);
  const [getAkkuStatus2, setAkkuStatus2] = createSignal(0);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

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

    const systemStatusCharacteristic =
      await createCharateristicWithEventListener(
        service,
        CraftyCharacteristicUUIDs.systemStatusCharacteristic,
        handleSystemStatus
      );
    if (!systemStatusCharacteristic) {
      return Promise.reject("systemStatusCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      systemStatusCharacteristic,
    }));

    const akkuStatusCharacteristic = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.akkuStatusCharacteristic,
      handleAkkuStatus
    );
    if (!akkuStatusCharacteristic) {
      return Promise.reject("akkuStatusCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      akkuStatusCharacteristic,
    }));

    const akkuStatusCharacteristic2 =
      await createCharateristicWithEventListener(
        service,
        CraftyCharacteristicUUIDs.akkuStatusCharacteristic2,
        handleAkkuStatus2
      );
    if (!akkuStatusCharacteristic2) {
      return Promise.reject("akkuStatusCharacteristic2 not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      akkuStatusCharacteristic2,
    }));

    // factoryResetCharacteristic is write-only
    const factoryResetCharacteristic = await service.getCharacteristic(
      CraftyCharacteristicUUIDs.factoryResetCharacteristic
    );
    if (!factoryResetCharacteristic) {
      return Promise.reject("factoryResetCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      factoryResetCharacteristic,
    }));
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
