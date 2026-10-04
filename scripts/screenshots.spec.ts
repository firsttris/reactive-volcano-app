import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { test } from "../e2e/helpers/fixtures";

/**
 * Renders the screenshots in docs/ against the Bluetooth mock from e2e/.
 * Run with `npm run screenshots` (dev server on :5173 is started if needed).
 */

const shot = (name: string) => `docs/screenshot-${name}.png`;

/**
 * The mock never sends Venty/Veazy notifications, so answer every write on
 * the control characteristic with a realistic STATUS frame: 182 °C now,
 * 185 °C target, boost +10, superboost +15, battery 76 %, heater normal.
 */
const feedVentyStatus = (page: Page) =>
  page.addInitScript(() => {
    const frame = new Uint8Array(20);
    const view = new DataView(frame.buffer);
    view.setUint8(0, 0x01);
    view.setUint16(2, 1820, true);
    view.setUint16(4, 1850, true);
    view.setUint8(6, 10);
    view.setUint8(7, 15);
    view.setUint8(8, 76);
    view.setUint8(11, 1);

    const bluetooth = navigator.bluetooth as unknown as {
      requestDevice: (options: unknown) => Promise<BluetoothDevice>;
    };
    const requestDevice = bluetooth.requestDevice.bind(bluetooth);
    bluetooth.requestDevice = async (options) => {
      const device = await requestDevice(options);
      const gatt = device.gatt as BluetoothRemoteGATTServer;
      const connect = gatt.connect.bind(gatt);
      gatt.connect = async () => {
        const server = await connect();
        const getService = server.getPrimaryService.bind(server);
        server.getPrimaryService = async (uuid) => {
          const service = await getService(uuid);
          const getChar = service.getCharacteristic.bind(service);
          service.getCharacteristic = async (charUuid) => {
            const characteristic = await getChar(charUuid);
            const handlers: ((event: Event) => void)[] = [];
            const add = characteristic.addEventListener.bind(characteristic);
            characteristic.addEventListener = ((
              type: string,
              handler: (event: Event) => void
            ) => {
              handlers.push(handler);
              add(type, handler);
            }) as typeof characteristic.addEventListener;
            const write = characteristic.writeValue.bind(characteristic);
            characteristic.writeValue = async (value) => {
              await write(value);
              const event = { target: { value: new DataView(frame.buffer) } };
              for (const handler of handlers)
                handler(event as unknown as Event);
            };
            return characteristic;
          };
          return service;
        };
        return server;
      };
      return device;
    };
  });

const connect = async (page: Page, url: RegExp) => {
  await page.goto("/");
  await page.locator('button:has-text("Connect")').first().click();
  await page.waitForURL(url);
  await page.waitForTimeout(1500);
};

test("connect", async ({ page, bluetoothDevice }) => {
  await bluetoothDevice("VOLCANO");
  await page.goto("/");
  await page.waitForTimeout(800);
  await page.screenshot({ path: shot("connect") });
});

test("volcano", async ({ page, bluetoothDevice }) => {
  await bluetoothDevice("VOLCANO");
  await connect(page, /volcano/);
  await page.getByRole("button", { name: "210°" }).click();
  await page.getByText("Heater", { exact: true }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: shot("volcano") });

  await page.getByText("Workflows").last().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: shot("volcano-workflows") });

  await page.getByText("Settings").last().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: shot("volcano-settings") });
});

test("venty", async ({ page, bluetoothDevice }) => {
  await bluetoothDevice("VENTY");
  await feedVentyStatus(page);
  await connect(page, /venty/);
  await page.screenshot({ path: shot("venty") });

  await page.getByText("Settings").last().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: shot("venty-settings") });
});

test("crafty", async ({ page, bluetoothDevice }) => {
  await bluetoothDevice("CRAFTY");
  await connect(page, /crafty/);
  await page.getByText("Heater", { exact: true }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: shot("crafty") });

  await page.getByText("Settings").last().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: shot("crafty-settings") });
});

test("light mode", async ({ page, bluetoothDevice }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await bluetoothDevice("VOLCANO");
  await connect(page, /volcano/);
  await page.getByRole("button", { name: "210°" }).click();
  await page.getByText("Heater", { exact: true }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: shot("volcano-light") });
});

// Runs last: builds the banner and the hero image from the files above
test("banner and hero", async ({ browser }) => {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 360 },
    deviceScaleFactor: 2,
  });
  const svg = readFileSync("docs/banner.svg", "utf8");
  await page.setContent(
    `<body style="margin:0;background:transparent">${svg}</body>`
  );
  await page
    .locator("svg")
    .screenshot({ path: "docs/banner.png", omitBackground: true });

  const dataUri = (name: string) =>
    `data:image/png;base64,${readFileSync(shot(name)).toString("base64")}`;
  const phone = (name: string, label: string) => `
    <figure>
      <img src="${dataUri(name)}" />
      <figcaption>${label}</figcaption>
    </figure>`;
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.setContent(`
    <style>
      body { margin: 0; background: #09090b; font-family: system-ui, sans-serif; }
      main { display: flex; gap: 40px; justify-content: center; align-items: flex-start;
             padding: 48px 40px 36px;
             background: radial-gradient(ellipse at 50% 0%, rgb(249 115 22 / .18), transparent 60%); }
      figure { margin: 0; text-align: center; }
      img { width: 340px; border-radius: 36px; border: 1px solid #27272a;
            box-shadow: 0 24px 60px rgb(0 0 0 / .6); display: block; }
      figcaption { color: #a1a1aa; font-size: 18px; margin-top: 18px; letter-spacing: .02em; }
      figure:nth-child(2) { margin-top: -12px; }
    </style>
    <main>
      ${phone("volcano", "Desktop vaporizer")}
      ${phone("venty", "Portable · boost modes")}
      ${phone("crafty", "Portable · battery &amp; boost")}
    </main>`);
  await page.locator("main").screenshot({ path: "docs/hero.png" });
  await page.close();
});
