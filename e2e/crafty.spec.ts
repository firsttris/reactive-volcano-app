import { test, expect } from './helpers/fixtures';

test.describe('Crafty Gerät - Verbindung', () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    await bluetoothDevice('CRAFTY');
    await page.goto('/');
  });

  test('sollte Verbindung zu Crafty-Gerät herstellen', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Nach erfolgreicher Verbindung sollte zur Crafty-View navigiert werden
    await page.waitForURL(/.*crafty.*/i, { timeout: 5000 });
    
    // Prüfe ob die Temperatur-Komponente sichtbar ist
    await expect(page.locator('text=/temperature/i').first()).toBeVisible({ 
      timeout: 5000 
    });
  });

  test('sollte zur Crafty-Ansicht navigieren', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Prüfe ob die URL zur Crafty-View wechselt
    await page.waitForURL(/.*crafty.*/i, { timeout: 5000 });
  });

  test('sollte Temperatur anzeigen', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    await page.waitForURL(/.*crafty.*/i, { timeout: 5000 });

    // Die gemockte Temperatur ist 180°C
    await expect(page.locator('text=/180/i').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Crafty Gerät - Steuerung', () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    await bluetoothDevice('CRAFTY');
    await page.goto('/');
    
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();
    await page.waitForURL(/.*crafty.*/i, { timeout: 10000 });
  });

  test('sollte Heizungssteuerung anzeigen', async ({ page }) => {
    // Crafty zeigt "Crafty" Text und einen Button mit Fire-Icon
    await expect(page.locator('text=/crafty/i').first()).toBeVisible({ timeout: 5000 });
    // Prüfe ob mindestens ein Button sichtbar ist (Heater Control)
    await expect(page.locator('button').first()).toBeVisible({ timeout: 5000 });
  });
});
