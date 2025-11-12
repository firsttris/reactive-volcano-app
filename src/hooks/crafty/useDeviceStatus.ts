import { createEffect, createSignal, onCleanup } from "solid-js";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
} from "../../utils/characteristic";

export interface CraftyDeviceStatus {
  isHeating: boolean;
  hasErrors: boolean;
  boostModeActive: boolean;
  superBoostModeActive: boolean;
}

export const useDeviceStatus = () => {
  const [getDeviceStatus, setDeviceStatus] = createSignal<CraftyDeviceStatus>({
    isHeating: false,
    hasErrors: false,
    boostModeActive: false,
    superBoostModeActive: false,
  });
  const { getCraftyService3, getCharacteristics, setCharacteristics } =
    useBluetooth();

  const handleProjectRegister = (value: DataView) => {
    const prjStatusReg = value.getUint16(0, true);
    const boostModeActive = (prjStatusReg & 0x0200) !== 0; // MASK_PRJSTAT_BOOST_MODE_ENABLED
    const superBoostModeActive = (prjStatusReg & 0x0400) !== 0; // MASK_PRJSTAT_SUPERBOOST_MODE_ENABLED
    const hasErrors = (prjStatusReg & 0x2000) !== 0; // Error flags

    setDeviceStatus({
      isHeating: boostModeActive || superBoostModeActive,
      hasErrors,
      boostModeActive,
      superBoostModeActive,
    });
  };

  const handleCharacteristics = async () => {
    const service = getCraftyService3();
    if (!service) return;

    const projectRegister = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.projectRegister,
      handleProjectRegister
    );
    if (!projectRegister) {
      return Promise.reject("projectRegisterCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      projectRegister,
    }));
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const characteristics = getCharacteristics();
    if (characteristics.projectRegister) {
      detachEventListener(
        characteristics.projectRegister,
        handleProjectRegister
      );
    }
  });

  return {
    getDeviceStatus,
  };
};
