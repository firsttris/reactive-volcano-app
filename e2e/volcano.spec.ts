import type { MockBluetooth } from "./helpers/bluetooth-mock";
import { expect, test } from "./helpers/fixtures";

test.describe("Volcano Gerät - Verbindung und Grundfunktionen", () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    // Bluetooth-Mock für Volcano-Gerät initialisieren
    await bluetoothDevice("VOLCANO");
    await page.goto("/");
  });

  test("sollte Connect-Button anzeigen", async ({ page }) => {
    // Warte auf die Seite
    await expect(page.locator('button:has-text("Connect")')).toBeVisible({
      timeout: 10000,
    });
  });

  test("sollte Verbindung zu Volcano-Gerät herstellen", async ({ page }) => {
    // Klicke auf Connect-Button
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Prüfe, ob die Verbindung erfolgreich war und zur Volcano-View navigiert
    await page.waitForURL(/.*volcano.*/i, { timeout: 5000 });
  });

  test("sollte Temperatur anzeigen nach Verbindung", async ({ page }) => {
    // Verbinde mit dem Gerät
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Warte auf Verbindung zur Volcano-View
    await page.waitForURL(/.*volcano.*/i, { timeout: 5000 });

    // Prüfe, ob Temperatur-Werte angezeigt werden
    // Die gemockte Temperatur ist 200°C (current) und 230°C (target)
    await expect(page.locator("text=/200/i")).toBeVisible({ timeout: 5000 });
  });

  test("sollte zur Volcano-Ansicht navigieren", async ({ page }) => {
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Prüfe ob die URL zur Volcano-View wechselt
    await page.waitForURL(/.*volcano.*/i, { timeout: 5000 });
  });
});

test.describe("Volcano Gerät - Temperatursteuerung", () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    await bluetoothDevice("VOLCANO");
    await page.goto("/");

    // Verbinde automatisch
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();
    await page.waitForURL(/.*volcano.*/i, { timeout: 10000 });
  });

  test("sollte Temperaturregler anzeigen", async ({ page }) => {
    // Prüfe ob die +/- Buttons für die Zieltemperatur vorhanden sind
    await expect(
      page.getByRole("button", { name: "Increase temperature" })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: "Decrease temperature" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("sollte Heizungssteuerung anzeigen", async ({ page }) => {
    // Volcano zeigt "HYBRID" Text zwischen den Heat/Pump Buttons
    await expect(page.locator("text=/hybrid/i").first()).toBeVisible({
      timeout: 5000,
    });
    // Prüfe ob mindestens zwei Buttons sichtbar sind (Heat und Pump)
    await expect(page.locator("button").nth(0)).toBeVisible({ timeout: 5000 });
    await expect(page.locator("button").nth(1)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Volcano Gerät - Disconnect", () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    await bluetoothDevice("VOLCANO");
    await page.goto("/");
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();
    await page.waitForURL(/.*volcano.*/i, { timeout: 10000 });
  });

  const dropConnection = (page: import("@playwright/test").Page) =>
    page.evaluate(() => {
      const { bluetooth } = window.navigator as unknown as {
        bluetooth: MockBluetooth;
      };
      bluetooth._currentDevice?.gatt?.disconnect();
    });

  test("sollte Verbindung trennen können", async ({ page }) => {
    await page.getByRole("button", { name: "Disconnect" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Disconnect" })
      .click();

    await expect(
      page.locator('button:has-text("Connect")').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("sollte nach Verbindungsabbruch automatisch neu verbinden", async ({
    page,
  }) => {
    await dropConnection(page);

    await expect(
      page.getByText("Reconnecting to Volcano Hybrid")
    ).toBeVisible();
    await page.waitForURL(/.*volcano.*/i, { timeout: 10000 });
    await expect(page.locator("text=/200/i").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("sollte beim Abbrechen des Neuverbindens die Verbindung freigeben", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const { bluetooth } = window.navigator as unknown as {
        bluetooth: MockBluetooth;
      };
      bluetooth._connectDelayMs = 3_000;
    });
    await dropConnection(page);
    await expect(page.getByText("Attempt 1 of 3")).toBeVisible();
    // The first attempt connects after 2 s; cancel while it is pending
    await page.waitForTimeout(3_000);
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(3_000);

    await expect(
      page.getByRole("button", { name: /Connect/ }).first()
    ).toBeVisible();
    expect(page.url()).not.toMatch(/volcano/i);
    const connected = await page.evaluate(() => {
      const { bluetooth } = window.navigator as unknown as {
        bluetooth: MockBluetooth;
      };
      return bluetooth._currentDevice?.gatt?.connected;
    });
    expect(connected).toBe(false);
  });

  test("sollte nach erfolglosen Versuchen aufgeben", async ({ page }) => {
    await page.clock.install();
    await page.evaluate(() => {
      const { bluetooth } = window.navigator as unknown as {
        bluetooth: MockBluetooth;
      };
      bluetooth._failConnect = true;
    });
    await dropConnection(page);
    await expect(page.getByText("Attempt 1 of 3")).toBeVisible();

    await page.clock.runFor(30_000);

    await expect(page.getByRole("alert")).toContainText("Connection lost");
    await expect(
      page.locator('button:has-text("Connect")').first()
    ).toBeVisible();
  });
});

test.describe("Volcano Gerät - Workflow-Schritte", () => {
  test.beforeEach(async ({ page, bluetoothDevice }) => {
    await bluetoothDevice("VOLCANO");
    await page.goto("/");
    await page.locator('button:has-text("Connect")').first().click();
    await page.waitForURL(/.*volcano.*/i, { timeout: 10000 });
    await page.getByRole("link", { name: "Workflows" }).click();
  });

  const editSteps = async (
    page: import("@playwright/test").Page,
    n: number
  ) => {
    await page.getByRole("button", { name: "More actions" }).nth(n).click();
    await page.getByRole("menuitem", { name: "Edit Workflow Steps" }).click();
  };

  test("sollte immer die Schritte des Workflows aus der URL zeigen", async ({
    page,
  }) => {
    await editSteps(page, 0);
    await expect(page.getByRole("listitem")).toHaveCount(11);
    await page.getByRole("button", { name: "Done" }).click();

    // Starting another workflow selects it; the editor must not follow
    await page.getByRole("button", { name: "Start" }).nth(1).click();
    await page.getByRole("button", { name: "Stop" }).first().click();
    await page.goBack();

    await expect(page).toHaveURL(/workflow\/list\/default-ballon/);
    await expect(page.getByRole("listitem")).toHaveCount(11);
  });

  test("sollte einen neuen Schritt wie den letzten anlegen", async ({
    page,
  }) => {
    await editSteps(page, 1);
    await expect(page.getByRole("listitem")).toHaveCount(4);
    await page.getByRole("button", { name: "Add step" }).click();

    await expect(page).toHaveURL(/workflow\/form\//);
    await expect(page.getByText("220 °C")).toBeVisible();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("listitem")).toHaveCount(5);
  });
});
