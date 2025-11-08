import { useBluetooth } from "../../provider/BluetoothProvider";
import { bluetoothQueue } from "../../utils/bluetoothQueue";

/**
 * Hook for managing device settings that aren't covered by other hooks:
 * - Factory Reset
 * - Boost Visualization (Veazy has inverted logic)
 */
export function useSettings() {
  const { getCharacteristics, deviceInfo } = useBluetooth();

  /**
   * Factory Reset
   * CMD 0x01 with mask (1 << 7)
   * Byte 14: BIT_SETTINGS_FACTORY_RESET (1 << 2)
   * Byte 15: Mask for bit 2
   */
  const factoryReset = async () => {
    const buffer = new ArrayBuffer(20);
    const dataView = new DataView(buffer);
    dataView.setUint8(0, 1); // CMD 0x01
    dataView.setUint8(1, 128); // mask (1 << 7)
    dataView.setUint8(14, 0x04); // BIT_SETTINGS_FACTORY_RESET (1 << 2)
    dataView.setUint8(15, 4); // Mask for bit 2

    const control = getCharacteristics().control;
    if (control) {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    }
  };

  /**
   * Boost Visualization
   * CMD 0x01 with mask (1 << 7)
   * Byte 14: BIT_SETTINGS_BOOST_VISUALIZATION (1 << 6)
   * Byte 15: Mask for bit 6
   * Note: For Veazy, the logic is inverted
   */
  const setBoostVisualization = async (enabled: boolean) => {
    const buffer = new ArrayBuffer(20);
    const dataView = new DataView(buffer);
    dataView.setUint8(0, 1); // CMD 0x01
    dataView.setUint8(1, 128); // mask (1 << 7)

    const info = deviceInfo();
    // For Veazy, invert the logic
    const shouldSetBit = info.type === "VEAZY" ? !enabled : enabled;

    dataView.setUint8(14, shouldSetBit ? 0x40 : 0x00); // BIT_SETTINGS_BOOST_VISUALIZATION (1 << 6)
    dataView.setUint8(15, 64); // Mask for bit 6

    const control = getCharacteristics().control;
    if (control) {
      await bluetoothQueue.add(() => control.writeValue(buffer));
    }
  };

  return {
    factoryReset,
    setBoostVisualization,
  };
}
