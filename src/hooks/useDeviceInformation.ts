import { createEffect, createSignal } from "solid-js";
import { CharateristicUUIDs } from "../utils/uuids";
import { createCharateristic } from "../utils/characteristic";
import { useBluetooth } from "../provider/BluetoothProvider";

export function useDeviceInformation(
) {
  const [getSerialNumber, setSerialNumber] = createSignal<string>("");
  const [getFirmwareVersion, setFirmwareVersion] = createSignal<string>("");
  const [getBleFirmwareVersion, setBleFirmwareVersion] =
    createSignal<string>("");
    const { getService3 } = useBluetooth();

  createEffect(() => {
    const service = getService3();
    if (!service) return;
    createCharateristic(
      service,
      CharateristicUUIDs.serialNumber,
      handleSerialNumber
    );
    createCharateristic(
      service,
      CharateristicUUIDs.firmwareVersion,
      handleFirmwareVersion
    );
    createCharateristic(
      service,
      CharateristicUUIDs.firmwareBLEVersion,
      handleBLEFirmwareVersion
    );
  });

  const handleSerialNumber = (value: DataView) =>
    handleVersion(value, "serialNumber");
  const handleFirmwareVersion = (value: DataView) =>
    handleVersion(value, "firmwareVersion");
  const handleBLEFirmwareVersion = (value: DataView) =>
    handleVersion(value, "bLEFirmwareVersion");

  const handleVersion = (
    value: DataView,
    field: "serialNumber" | "firmwareVersion" | "bLEFirmwareVersion"
  ) => {
    const decoder = new TextDecoder("utf-8");
    const serialNumber = decoder.decode(value).substring(0, 8);
    if (field === "serialNumber") {
      setSerialNumber(serialNumber);
    }
    if (field === "firmwareVersion") {
      setFirmwareVersion(serialNumber);
    }
    if (field === "bLEFirmwareVersion") {
      setBleFirmwareVersion(serialNumber);
    }
  };

  return {
    getSerialNumber,
    getFirmwareVersion,
    getBleFirmwareVersion,
  };
}
