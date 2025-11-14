import { createEffect, createSignal, onCleanup } from "solid-js";
import {
  convertBLEToUint16,
  convertToUInt8BLE,
} from "../../utils/bluetoothUtils";
import { VolcanoCharacteristicUUIDs, States } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  detachEventListener,
  getCharacteristic,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "./useWriteToCharacteristic";

export const useDeviceStatus = () => {
  const [isHeatingActive, setIsHeatingActive] = createSignal<boolean>(false);
  const [isPumpActive, setIsPumpActive] = createSignal<boolean>(false);
  const [isAutoShutdownActive, setIsAutoShutdownActive] =
    createSignal<boolean>(false);
  const {
    getVolcanoStateService,
    getVolcanoControlService,
    getCharacteristics,
    setCharacteristics,
  } = useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

  const handleDeviceStateCharacteristics = async () => {
    const stateService = getVolcanoStateService();
    if (!stateService) return;
    const activity = await createCharateristicWithEventListener(
      stateService,
      VolcanoCharacteristicUUIDs.activity,
      handleActivity
    );
    if (!activity) {
      return Promise.reject("activityCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      activity,
    }));
  };

  const handleDeviceControlCharacteristics = async () => {
    const service = getVolcanoControlService();
    if (!service) return;

    const heaterOnCharacteristic = await getCharacteristic(
      service,
      VolcanoCharacteristicUUIDs.heaterOn
    );
    if (!heaterOnCharacteristic) {
      return Promise.reject("heaterOnCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      heaterOn: heaterOnCharacteristic,
    }));
    const heaterOffCharacteristic = await getCharacteristic(
      service,
      VolcanoCharacteristicUUIDs.heaterOff
    );
    if (!heaterOffCharacteristic) {
      return Promise.reject("heaterOffCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      heaterOff: heaterOffCharacteristic,
    }));
    const pumpOffCharacteristic = await getCharacteristic(
      service,
      VolcanoCharacteristicUUIDs.pumpOff
    );
    if (!pumpOffCharacteristic) {
      return Promise.reject("pumpOffCharacteristic not found");
    }
    setCharacteristics((prev) => ({
      ...prev,
      pumpOff: pumpOffCharacteristic,
    }));
    const pumpOnCharacteristic = await getCharacteristic(
      service,
      VolcanoCharacteristicUUIDs.pumpOn
    );
    if (!pumpOnCharacteristic) {
      return Promise.reject("pumpOnCharacteristic not found");
    }

    setCharacteristics((prev) => ({
      ...prev,
      pumpOn: pumpOnCharacteristic,
    }));
  };

  const setPumpOn = async () => {
    await writeValueToCharacteristic("pumpOn", 0, convertToUInt8BLE);
    setIsPumpActive(true);
  };

  const setPumpOff = async () => {
    await writeValueToCharacteristic("pumpOff", 0, convertToUInt8BLE);
    setIsPumpActive(false);
  };

  const setHeatOn = async () => {
    await writeValueToCharacteristic("heaterOn", 0, convertToUInt8BLE);
    setIsHeatingActive(true);
  };

  const setHeatOff = async () => {
    await writeValueToCharacteristic("heaterOff", 0, convertToUInt8BLE);
    setIsHeatingActive(false);
  };

  createEffect(() => {
    handleDeviceStateCharacteristics();
    handleDeviceControlCharacteristics();
  });

  onCleanup(() => {
    const { activity } = getCharacteristics();
    if (activity) {
      detachEventListener(activity, handleActivity);
    }
  });

  const handleActivity = (value: DataView): void => {
    const convertedValue = convertBLEToUint16(value);
    const isHeatingActive = (convertedValue & States.HEIZUNG_ENA) !== 0;
    setIsHeatingActive(isHeatingActive);
    const isPumpActive = (convertedValue & States.PUMPE_FET_ENABLE) !== 0;
    setIsPumpActive(isPumpActive);
    const isAutoshutdownActive =
      (convertedValue & States.ENABLE_AUTOBLESHUTDOWN) !== 0;
    setIsAutoShutdownActive(isAutoshutdownActive);
  };

  return {
    isHeatingActive,
    isPumpActive,
    isAutoShutdownActive,
    setPumpOn,
    setPumpOff,
    setHeatOn,
    setHeatOff,
  };
};
