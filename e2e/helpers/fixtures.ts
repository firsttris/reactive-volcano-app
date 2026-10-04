import { test as base } from "@playwright/test";
import {
  type DeviceType,
  type MockOptions,
  mockBluetooth,
} from "./bluetooth-mock";

type TestFixtures = {
  bluetoothDevice: (
    deviceType?: DeviceType,
    options?: MockOptions
  ) => Promise<void>;
};

/**
 * Erweiterte Test-Fixtures mit Bluetooth-Mock-Unterstützung
 */
export const test = base.extend<TestFixtures>({
  bluetoothDevice: async ({ page }, use) => {
    const setupBluetooth = async (
      deviceType: DeviceType = "VOLCANO",
      options: MockOptions = {}
    ) => {
      await mockBluetooth(page, deviceType, options);
    };
    await use(setupBluetooth);
  },
});

export { expect } from "@playwright/test";
