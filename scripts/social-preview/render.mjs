// Renders social-preview.html to docs/social-preview.png (1280 × 640), the image
// for Settings → Social preview on GitHub. Run: npm run social-preview
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../../docs/social-preview.png");
// Like npm run icons: set CHROMIUM_PATH to use another Chromium
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 640 },
  deviceScaleFactor: 1,
});
await page.goto(`file://${path.join(here, "social-preview.html")}`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, type: "png" });
await browser.close();
console.log("written", out);
