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

export const useProjectRegister = () => {
  const [getProjectRegister, setProjectRegister] = createSignal(0);
  const { getDeviceControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

  const handleProjectRegister = (value: DataView) => {
    const register = convertBLEToUint16(value);
    setProjectRegister(register);
  };

  const handleCharacteristics = async () => {
    const service = getDeviceControlService();
    if (!service) return;

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

    // sicherheitscode is write-only
    const sicherheitscode = await service.getCharacteristic(
      CraftyCharacteristicUUIDs.sicherheitscode
    );
    if (!sicherheitscode) {
      return Promise.reject("sicherheitscodeCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      sicherheitscode,
    }));
  };

  const setSicherheitscode = async (value: number) => {
    await writeValueToCharacteristic(
      "sicherheitscode",
      value,
      convertToUInt16BLE
    );
  };

  createEffect(() => {
    handleCharacteristics();
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
