import { createEffect, createSignal, onCleanup } from "solid-js";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";

export interface CraftyDeviceInformation {
  serialNumber: string;
  firmwareVersion: string;
  firmwareBLEVersion: string;
}

export const useDeviceInformation = () => {
  const [getDeviceInformation, setDeviceInformation] =
    createSignal<CraftyDeviceInformation>({
      serialNumber: "",
      firmwareVersion: "",
      firmwareBLEVersion: "",
    });
  const { getCraftyService2, getCharacteristics, setCharacteristics } =
    useBluetooth();

  const handleSerialNumber = (value: DataView) => {
    const decoder = new TextDecoder("utf-8");
    const serialNumber = decoder.decode(value).substring(0, 8);
    setDeviceInformation((prev) => ({
      ...prev,
      serialNumber,
    }));
  };

  const handleFirmwareVersion = (value: DataView) => {
    const decoder = new TextDecoder("utf-16");
    const firmwareVersion = decoder.decode(value);
    setDeviceInformation((prev) => ({
      ...prev,
      firmwareVersion,
    }));
  };

  const handleFirmwareBLEVersion = (value: DataView) => {
    const firmwareBLEVersion = `V${value.getUint8(0)}.${value.getUint8(1)}.${value.getUint8(2)}`;
    setDeviceInformation((prev) => ({
      ...prev,
      firmwareBLEVersion,
    }));
  };

  const handleCharacteristics = async () => {
    const service = getCraftyService2();
    if (!service) return;

    // Serial number
    const serialNumber = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.serialNumber,
      handleSerialNumber
    );
    if (!serialNumber) {
      return Promise.reject("serialNumberCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      serialNumber,
    }));

    // Firmware version
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

    // BLE Firmware version
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
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const characteristics = getCharacteristics();
    if (characteristics.serialNumber) {
      detachEventListener(characteristics.serialNumber, handleSerialNumber);
    }
    if (characteristics.firmwareVersion) {
      detachEventListener(
        characteristics.firmwareVersion,
        handleFirmwareVersion
      );
    }
    if (characteristics.firmwareBLEVersion) {
      detachEventListener(
        characteristics.firmwareBLEVersion,
        handleFirmwareBLEVersion
      );
    }
  });

  return {
    getDeviceInformation,
  };
};
