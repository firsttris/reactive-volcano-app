import { createEffect, createSignal, onCleanup } from "solid-js";
import {
  convertBLEToUint16,
  convertFahrenheitToCelsius,
  convertToUInt16BLE,
} from "../../utils/bluetoothUtils";
import { CraftyCharacteristicUUIDs } from "../../utils/uuids";
import {
  createCharateristicWithEventListener,
  createCharateristic,
  detachEventListener,
} from "../../utils/characteristic";
import { useBluetooth } from "../../provider/BluetoothProvider";
import { useWriteToCharacteristic } from "../volcano/useWriteToCharacteristic";
import { bluetoothQueue } from "../../utils/bluetoothQueue";

const MIN_TEMP = 40;
const MAX_TEMP = 210;

// A Crafty in Fahrenheit mode reports the target temperature in °F
const parseTargetTemperature = (value: DataView) => {
  const temperature = Math.round(convertBLEToUint16(value) / 10.0);
  return temperature > MAX_TEMP
    ? convertFahrenheitToCelsius(temperature)
    : temperature;
};

export const useTemperature = () => {
  const [getTargetTemperature, setTargetTemperature] = createSignal(0);
  const [getCurrentTemperature, setCurrentTemperature] = createSignal(0);
  const [getBoostTemperature, setBoostTemperature] = createSignal(0);
  const { getCraftyControlService, getCharacteristics, setCharacteristics } =
    useBluetooth();
  const { writeValueToCharacteristic } = useWriteToCharacteristic();

  const handleTargetTemperature = (value: DataView) => {
    const targetTemperature = parseTargetTemperature(value);
    console.log(
      "Crafty Temperature: Target temperature updated to",
      targetTemperature
    );
    setTargetTemperature(targetTemperature);
  };

  const handleCurrentTemperature = (value: DataView) => {
    const convertedValue = convertBLEToUint16(value);
    const currentTemperature = Math.round(convertedValue / 10.0);
    console.log(
      "Crafty Temperature: Current temperature updated to",
      currentTemperature
    );
    setCurrentTemperature(currentTemperature);
  };

  const handleBoostTemperature = (value: DataView) => {
    const convertedValue = convertBLEToUint16(value);
    const boostTemperature = Math.round(convertedValue / 10.0);
    console.log(
      "Crafty Temperature: Boost temperature updated to",
      boostTemperature
    );
    setBoostTemperature(boostTemperature);
  };

  const handleCharacteristics = async () => {
    const service = getCraftyControlService();
    if (!service) {
      console.log("Crafty Temperature: No Crafty control service available");
      return;
    }
    console.log("Crafty Temperature: Setting up temperature characteristics");

    // writeTemp characteristic does NOT support notifications on old Crafty devices
    // Use createCharateristic (read only) instead of createCharateristicWithEventListener
    const targetTemperature = await createCharateristic(
      service,
      CraftyCharacteristicUUIDs.writeTemp,
      handleTargetTemperature
    );
    if (!targetTemperature) {
      console.error("Crafty Temperature: writeTempCharacteristic not found");
      return Promise.reject("writeTempCharacteristic not found");
    }
    console.log("Crafty Temperature: Target temperature characteristic set up");
    setCharacteristics((prev) => ({
      ...prev,
      writeTemp: targetTemperature,
    }));

    const currentTemperature = await createCharateristicWithEventListener(
      service,
      CraftyCharacteristicUUIDs.currTemperatureChanged,
      handleCurrentTemperature
    );
    if (!currentTemperature) {
      console.error(
        "Crafty Temperature: currTemperatureChangedCharacteristic not found"
      );
      return Promise.reject("currTemperatureChangedCharacteristic not found");
    }
    console.log(
      "Crafty Temperature: Current temperature characteristic set up"
    );
    setCharacteristics((prev) => ({
      ...prev,
      currTemperatureChanged: currentTemperature,
    }));

    // writeBoostTemp characteristic does NOT support notifications on old Crafty devices
    // Use createCharateristic (read only) instead of createCharateristicWithEventListener
    const boostTemperature = await createCharateristic(
      service,
      CraftyCharacteristicUUIDs.writeBoostTemp,
      handleBoostTemperature
    );
    if (!boostTemperature) {
      console.error(
        "Crafty Temperature: writeBoostTempCharacteristic not found"
      );
      return Promise.reject("writeBoostTempCharacteristic not found");
    }
    console.log("Crafty Temperature: Boost temperature characteristic set up");
    setCharacteristics((prev) => ({
      ...prev,
      writeBoostTemp: boostTemperature,
    }));
  };

  const setTemperature = async (value: number) => {
    // Clamp value to valid range (40-210°C)
    const clampedValue = Math.max(MIN_TEMP, Math.min(MAX_TEMP, value));
    console.log(
      "Crafty Temperature: Setting target temperature to",
      clampedValue
    );

    // Update local state immediately for responsive UI
    setTargetTemperature(clampedValue);

    try {
      await writeValueToCharacteristic(
        "writeTemp",
        clampedValue * 10,
        convertToUInt16BLE
      );

      // Re-read the value from device to confirm
      const characteristics = getCharacteristics();
      const writeTemp = characteristics.writeTemp;
      if (writeTemp) {
        const confirmedValue = await bluetoothQueue.add(() =>
          writeTemp.readValue()
        );
        if (confirmedValue) {
          const confirmedTemp = parseTargetTemperature(confirmedValue);
          console.log(
            "Crafty Temperature: Confirmed target temperature",
            confirmedTemp
          );
          setTargetTemperature(confirmedTemp);
        }
      }
    } catch (error) {
      console.error("Crafty Temperature: Failed to set temperature", error);
      // Revert to current value on error
      const characteristics = getCharacteristics();
      const writeTemp = characteristics.writeTemp;
      if (writeTemp) {
        try {
          const currentValue = await bluetoothQueue.add(() =>
            writeTemp.readValue()
          );
          if (currentValue) {
            setTargetTemperature(parseTargetTemperature(currentValue));
          }
        } catch {
          // Ignore read error during recovery
        }
      }
    }
  };

  const setBoostTemp = async (value: number) => {
    // Clamp value to valid range (0-30); target + boost must not exceed 210°C
    const clampedValue = Math.max(
      0,
      Math.min(30, MAX_TEMP - getTargetTemperature(), value)
    );
    console.log(
      "Crafty Temperature: Setting boost temperature to",
      clampedValue
    );

    // Update local state immediately for responsive UI
    setBoostTemperature(clampedValue);

    try {
      await writeValueToCharacteristic(
        "writeBoostTemp",
        clampedValue * 10,
        convertToUInt16BLE
      );

      // Re-read the value from device to confirm
      const characteristics = getCharacteristics();
      const writeBoostTemp = characteristics.writeBoostTemp;
      if (writeBoostTemp) {
        const confirmedValue = await bluetoothQueue.add(() =>
          writeBoostTemp.readValue()
        );
        if (confirmedValue) {
          const confirmedTemp = Math.round(
            convertBLEToUint16(confirmedValue) / 10.0
          );
          console.log(
            "Crafty Temperature: Confirmed boost temperature",
            confirmedTemp
          );
          setBoostTemperature(confirmedTemp);
        }
      }
    } catch (error) {
      console.error(
        "Crafty Temperature: Failed to set boost temperature",
        error
      );
    }
  };

  createEffect(() => {
    handleCharacteristics();
  });

  onCleanup(() => {
    const { currTemperatureChanged } = getCharacteristics();
    // Only cleanup currTemperatureChanged which uses notifications
    // writeTemp and writeBoostTemp don't use notifications
    if (currTemperatureChanged) {
      detachEventListener(currTemperatureChanged, handleCurrentTemperature);
    }
  });

  return {
    getTargetTemperature,
    getCurrentTemperature,
    getBoostTemperature,
    setTemperature,
    setBoostTemp,
    handleCharacteristics,
  };
};
