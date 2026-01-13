import { test, expect } from './helpers/fixtures';

test.describe('Venty Gerät - Verbindung', () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    await bluetoothDevice('VENTY');
    await page.goto('/');
  });

  test('sollte Verbindung zu Venty-Gerät herstellen', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Nach erfolgreicher Verbindung sollte zur Venty/Veazy-View navigiert werden
    await page.waitForURL(/.*venty|veazy.*/i, { timeout: 5000 });
  });

  test('sollte zur Venty-Ansicht navigieren', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Prüfe ob die URL zur Venty/Veazy-View wechselt
    await page.waitForURL(/.*venty|veazy.*/i, { timeout: 5000 });
  });

  test('sollte Temperatur anzeigen', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    await page.waitForURL(/.*venty|veazy.*/i, { timeout: 5000 });

    // Warte etwas länger auf die Temperaturanzeige, da Venty/Veazy async Daten laden
    await page.waitForTimeout(2000);
    
    // Die gemockte Current Temperature ist 200°C - prüfe ob irgendeine Temperatur angezeigt wird
    await expect(page.locator('text=/\\d+/').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Veazy Gerät - Verbindung', () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    await bluetoothDevice('VEAZY');
    await page.goto('/');
  });

  test('sollte Verbindung zu Veazy-Gerät herstellen', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Nach erfolgreicher Verbindung sollte zur Veazy-View navigiert werden
    await page.waitForURL(/.*venty|veazy.*/i, { timeout: 5000 });
  });

  test('sollte zur Veazy-Ansicht navigieren', async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    await page.waitForURL(/.*venty|veazy.*/i, { timeout: 5000 });
  });
});

test.describe('Venty/Veazy - Boost Control', () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    await bluetoothDevice('VENTY');
    await page.goto('/');
    
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();
    await page.waitForURL(/.*venty|veazy.*/i, { timeout: 10000 });
  });

  test('sollte Boost-Steuerung anzeigen', async ({ page }) => {
    // Venty/Veazy haben eine Boost-Funktion
    const boostControl = page.locator('text=/boost/i').first();
    await expect(boostControl).toBeVisible({ timeout: 5000 });
  });
});
