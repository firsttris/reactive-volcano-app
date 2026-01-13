import { test, expect } from './helpers/fixtures';

test.describe('Volcano Gerät - Verbindung und Grundfunktionen', () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    // Bluetooth-Mock für Volcano-Gerät initialisieren
    await bluetoothDevice('VOLCANO');
    await page.goto('/');
  });

  test('sollte Connect-Button anzeigen', async ({ page }) => {
    // Warte auf die Seite
    await expect(page.locator('button:has-text("Connect")')).toBeVisible({ timeout: 10000 });
  });

  test('sollte Verbindung zu Volcano-Gerät herstellen', async ({ page }) => {
    // Klicke auf Connect-Button
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Prüfe, ob die Verbindung erfolgreich war und zur Volcano-View navigiert
    await page.waitForURL(/.*volcano.*/i, { timeout: 5000 });
  });

  test('sollte Temperatur anzeigen nach Verbindung', async ({ page }) => {
    // Verbinde mit dem Gerät
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Warte auf Verbindung zur Volcano-View
    await page.waitForURL(/.*volcano.*/i, { timeout: 5000 });

    // Prüfe, ob Temperatur-Werte angezeigt werden
    // Die gemockte Temperatur ist 200°C (current) und 230°C (target)
    await expect(page.locator('text=/200/i')).toBeVisible({ timeout: 5000 });
  });

  test('sollte zur Volcano-Ansicht navigieren', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Prüfe ob die URL zur Volcano-View wechselt
    await page.waitForURL(/.*volcano.*/i, { timeout: 5000 });
  });
});

test.describe('Volcano Gerät - Temperatursteuerung', () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    await bluetoothDevice('VOLCANO');
    await page.goto('/');
    
    // Verbinde automatisch
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();
    await page.waitForURL(/.*volcano.*/i, { timeout: 10000 });
  });

  test('sollte Temperaturregler anzeigen', async ({ page }) => {
    // Prüfe ob Slider oder Input für Temperatur vorhanden ist
    const tempControl = page.locator('input[type="range"], input[type="number"]').first();
    await expect(tempControl).toBeVisible({ timeout: 5000 });
  });

  test('sollte Heizungssteuerung anzeigen', async ({ page }) => {
    // Volcano zeigt "HYBRID" Text zwischen den Heat/Pump Buttons
    await expect(page.locator('text=/hybrid/i').first()).toBeVisible({ timeout: 5000 });
    // Prüfe ob mindestens zwei Buttons sichtbar sind (Heat und Pump)
    await expect(page.locator('button').nth(0)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button').nth(1)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Volcano Gerät - Disconnect', () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    await bluetoothDevice('VOLCANO');
    await page.goto('/');
    
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();
    await page.waitForURL(/.*volcano.*/i, { timeout: 10000 });
  });

  test('sollte Verbindung trennen können', async ({ page }) => {
    // Simuliere Disconnect über die gemockte API
    await page.evaluate(() => {
      const device = (window.navigator as any).bluetooth._currentDevice;
      if (device?.gatt?.connected) {
        device.gatt.disconnect();
      }
    });

    // Warte kurz für die React-Effekte
    await page.waitForTimeout(1000);
    
    // Prüfe, ob zur Startseite navigiert wurde (Connect-Button ist wieder da)
    await expect(page.locator('button:has-text("Connect")').first()).toBeVisible({ timeout: 5000 });
  });
});
