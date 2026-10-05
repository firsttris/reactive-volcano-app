import type { Page } from "@playwright/test";
import type { MockBluetooth } from "./helpers/bluetooth-mock";
import { expect, test } from "./helpers/fixtures";

test.describe("App - Allgemeine Funktionen", () => {
  test("sollte die Startseite laden", async ({ page }) => {
    await page.goto("/");

    // Prüfe ob die Seite geladen ist
    await expect(page).toHaveTitle(/Volcano|Vaporizer/i);
  });

  test("sollte Connect-Button ohne Bluetooth-Mock anzeigen", async ({
    page,
  }) => {
    // Dieser Test läuft ohne Bluetooth-Mock um zu prüfen,
    // dass die App auch ohne Bluetooth-Unterstützung lädt
    await page.goto("/");

    await expect(page.locator('button:has-text("Connect")')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("App - Navigation", () => {
  test("sollte zwischen verschiedenen Ansichten navigieren können", async ({
    page,
    bluetoothDevice,
  }) => {
    await bluetoothDevice("VOLCANO");
    await page.goto("/");

    // Verbinde mit Gerät
    const connectButton = page.locator('button:has-text("Connect")').first();
    await connectButton.click();

    // Warte auf Navigation zur Device-View
    await page.waitForURL(/.*volcano.*/i, { timeout: 5000 });

    // Überprüfe, dass die URL sich geändert hat
    const url = page.url();
    expect(url).toMatch(/volcano/i);
  });

  test("sollte Startseite anzeigen ohne Verbindung", async ({ page }) => {
    await page.goto("/");

    // Ohne Verbindung sollte Connect-Seite angezeigt werden
    await expect(page.locator('button:has-text("Connect")')).toBeVisible();
  });
});

test.describe("App - Responsive Design", () => {
  test("sollte auf Mobile-Größe funktionieren", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto("/");

    await expect(page.locator('button:has-text("Connect")')).toBeVisible({
      timeout: 10000,
    });
  });

  test("sollte auf Tablet-Größe funktionieren", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.goto("/");

    await expect(page.locator('button:has-text("Connect")')).toBeVisible({
      timeout: 10000,
    });
  });

  test("sollte auf Desktop-Größe funktionieren", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
    await page.goto("/");

    await expect(page.locator('button:has-text("Connect")')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("App - Sprache", () => {
  test.use({ locale: "de-DE" });

  test("sollte bei deutschem Browser auf Deutsch erscheinen", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.getByText("Gerät verbinden").first()).toBeVisible();
  });
});

test.describe("App - Zuletzt verwendetes Gerät", () => {
  test("sollte das bekannte Gerät mit einem Klick verbinden", async ({
    page,
    bluetoothDevice,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        "lastBluetoothDevice",
        JSON.stringify({
          id: "mock-volcano",
          name: "S&B VOLCANO HYBRID",
          type: "VOLCANO",
        })
      )
    );
    await bluetoothDevice("VOLCANO", { remembered: true });
    await page.goto("/");

    await page.getByRole("button", { name: /Connect Volcano Hybrid/ }).click();
    await page.waitForURL(/.*volcano.*/i, { timeout: 5000 });
  });

  test("sollte ohne bekanntes Gerät die Geräteauswahl anbieten", async ({
    page,
    bluetoothDevice,
  }) => {
    await bluetoothDevice("VOLCANO");
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Connect Device" })
    ).toBeVisible();
    await expect(page.getByText("Last used")).toHaveCount(0);
  });
});

test.describe("App - Zuletzt verwendetes Gerät, robust verbinden", () => {
  const rememberVolcano = (page: Page) =>
    page.addInitScript(() =>
      localStorage.setItem(
        "lastBluetoothDevice",
        JSON.stringify({
          id: "mock-volcano",
          name: "S&B VOLCANO HYBRID",
          type: "VOLCANO",
        })
      )
    );

  const setMock = (page: Page, values: Partial<MockBluetooth>) =>
    page.evaluate((v) => {
      const { bluetooth } = window.navigator as unknown as {
        bluetooth: MockBluetooth;
      };
      Object.assign(bluetooth, v);
    }, values);

  test.describe("mit watchAdvertisements (Windows, macOS, Android)", () => {
    test.use({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    });

    test("sollte das Gerät in Reichweite anzeigen und verbinden", async ({
      page,
      bluetoothDevice,
    }) => {
      await rememberVolcano(page);
      await bluetoothDevice("VOLCANO", { remembered: true, advertises: true });
      await page.goto("/");

      const button = page.getByRole("button", {
        name: /Connect Volcano Hybrid/,
      });
      await expect(button).toContainText("In range");
      await button.click();
      await page.waitForURL(/.*volcano.*/i, { timeout: 10000 });
    });
  });

  test("sollte fehlgeschlagene erste Versuche wiederholen", async ({
    page,
    bluetoothDevice,
  }) => {
    await rememberVolcano(page);
    await bluetoothDevice("VOLCANO", { remembered: true });
    await page.goto("/");
    await setMock(page, { _failConnectTimes: 2 });

    await page.getByRole("button", { name: /Connect Volcano Hybrid/ }).click();
    await page.waitForURL(/.*volcano.*/i, { timeout: 15000 });
  });

  const requestDeviceCalls = (page: Page) =>
    page.evaluate(
      () =>
        (window.navigator as unknown as { bluetooth: MockBluetooth }).bluetooth
          ._requestDeviceCalls
    );

  test("sollte bei unerreichbarem Gerät die Auswahl öffnen", async ({
    page,
    bluetoothDevice,
  }) => {
    await rememberVolcano(page);
    await bluetoothDevice("VOLCANO", { remembered: true });
    await page.clock.install();
    await page.goto("/");
    await setMock(page, { _failConnect: true });

    // The click still allows the chooser after the short direct attempt
    await page.getByRole("button", { name: /Connect Volcano Hybrid/ }).click();
    await page.clock.runFor(4_000);
    await expect.poll(() => requestDeviceCalls(page)).toBe(1);
    await expect(page.getByRole("alert")).toContainText("Connection failed");
  });

  test("sollte ohne Klick-Freigabe die Suche anbieten", async ({
    page,
    bluetoothDevice,
  }) => {
    await rememberVolcano(page);
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "userActivation", {
        value: { isActive: false, hasBeenActive: true },
      })
    );
    await bluetoothDevice("VOLCANO", { remembered: true });
    await page.clock.install();
    await page.goto("/");
    await setMock(page, { _failConnect: true });

    await page.getByRole("button", { name: /Connect Volcano Hybrid/ }).click();
    await page.clock.runFor(4_000);
    await expect(page.getByRole("alert")).toContainText(
      "Volcano Hybrid not reachable"
    );
    expect(await requestDeviceCalls(page)).toBe(0);

    // The chooser scans afresh and finds the device
    await setMock(page, { _failConnect: false });
    await page.getByRole("button", { name: "Search for device" }).click();
    await page.clock.runFor(2_000);
    await page.waitForURL(/.*volcano.*/i, { timeout: 10000 });
  });
});
