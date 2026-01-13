import { test as base } from '@playwright/test';
import { mockBluetooth, DeviceType } from './bluetooth-mock';

type TestFixtures = {
  bluetoothDevice: (deviceType?: DeviceType) => Promise<void>;
};

/**
 * Erweiterte Test-Fixtures mit Bluetooth-Mock-Unterstützung
 */
export const test = base.extend<TestFixtures>({
  bluetoothDevice: async ({ page }, use) => {
    const setupBluetooth = async (deviceType: DeviceType = 'VOLCANO') => {
      await mockBluetooth(page, deviceType);
    };
    await use(setupBluetooth);
  },
});

export { expect } from '@playwright/test';
