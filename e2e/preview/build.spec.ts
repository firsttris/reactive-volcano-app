import { expect, test } from "@playwright/test";

test.describe("Produktions-Build unter dem Pages-Pfad", () => {
  test("sollte einen Deep-Link nach dem Neuladen öffnen", async ({ page }) => {
    await page.goto("connect");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/reactive-volcano-app\/connect$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("sollte das Manifest unter dem Pfad ausliefern", async ({ page }) => {
    const response = await page.request.get("manifest.webmanifest");
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest.start_url).toContain("/reactive-volcano-app/");
    expect(manifest.scope).toBe("/reactive-volcano-app/");
  });

  test("sollte offline starten, sobald der Service Worker aktiv ist", async ({
    page,
    context,
  }) => {
    await page.goto("./");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    // The first load is not controlled yet; the second one is
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
