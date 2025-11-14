import { createEffect, createSignal, onCleanup } from "solid-js";
import { convertBLEToUint16 } from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";

export const useFirmware = () => {
  const [getFirmwareVersion, setFirmwareVersion] = createSignal("");
  const [getFirmwareBLEVersion, setFirmwareBLEVersion] = createSignal("");
  const [getStatusRegister2, setStatusRegister2] = createSignal(0);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();

  const handleFirmwareVersion = (value: DataView) => {
    const version = convertBLEToUint16(value);
    setFirmwareVersion(version.toString());
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

    const firmwareBLEVersion = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.firmwareBLEVersion,
      handleFirmwareBLEVersion
    );
    if (!firmwareBLEVersion) {
      return Promise.reject("firmwareBLEVersionCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      firmwareBLEVersion,
    }));

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
    handleCharacteristics,
  };
};
