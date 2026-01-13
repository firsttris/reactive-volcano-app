import { test, expect } from './helpers/fixtures';

test.describe('App - Allgemeine Funktionen', () => {
  test('sollte die Startseite laden', async ({ page }) => {
    await page.goto('/');
    
    // Prüfe ob die Seite geladen ist
    await expect(page).toHaveTitle(/Volcano|Vaporizer/i);
  });

  test('sollte Connect-Button ohne Bluetooth-Mock anzeigen', async ({ page }) => {
    // Dieser Test läuft ohne Bluetooth-Mock um zu prüfen, 
    // dass die App auch ohne Bluetooth-Unterstützung lädt
    await page.goto('/');
    
    await expect(page.locator('button:has-text("Connect")')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('App - Navigation', () => {
  test('sollte zwischen verschiedenen Ansichten navigieren können', async ({ page, bluetoothDevice }) => {
    await bluetoothDevice('VOLCANO');
    await page.goto('/');
    
    // Verbinde mit Gerät
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();
    
    // Warte auf Navigation zur Device-View
    await page.waitForURL(/.*volcano.*/i, { timeout: 5000 });
    
    // Überprüfe, dass die URL sich geändert hat
    const url = page.url();
    expect(url).toMatch(/volcano/i);
  });

  test('sollte Startseite anzeigen ohne Verbindung', async ({ page }) => {
    await page.goto('/');
    
    // Ohne Verbindung sollte Connect-Seite angezeigt werden
    await expect(page.locator('button:has-text("Connect")')).toBeVisible();
  });
});

test.describe('App - Responsive Design', () => {
  test('sollte auf Mobile-Größe funktionieren', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/');
    
    await expect(page.locator('button:has-text("Connect")')).toBeVisible({ timeout: 10000 });
  });

  test('sollte auf Tablet-Größe funktionieren', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.goto('/');
    
    await expect(page.locator('button:has-text("Connect")')).toBeVisible({ timeout: 10000 });
  });

  test('sollte auf Desktop-Größe funktionieren', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
    await page.goto('/');
    
    await expect(page.locator('button:has-text("Connect")')).toBeVisible({ timeout: 10000 });
  });
});
