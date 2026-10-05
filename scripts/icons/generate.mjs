/**
 * Renders the app icons in public/ from scripts/icons/icon.svg.
 *
 *   npm run icons
 *
 * Uses Playwright's Chromium; set CHROMIUM_PATH to use another Chromium.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const publicDir = join(root, "public");
const svg = readFileSync(join(root, "scripts/icons/icon.svg"), "utf8");

// Maskable and Apple icons are cropped by the platform: no rounded corners,
// the background has to fill the whole square
const fullBleed = svg.replace('rx="112"', 'rx="0"');

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage();

const render = async (source, size) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${source}`
  );
  return page.screenshot({ omitBackground: true });
};

const outputs = [
  ["pwa-192x192.png", svg, 192],
  ["pwa-512x512.png", svg, 512],
  ["maskable-512x512.png", fullBleed, 512],
  ["apple-touch-icon.png", fullBleed, 180],
];
for (const [file, source, size] of outputs) {
  writeFileSync(join(publicDir, file), await render(source, size));
  console.log(`public/${file}`);
}

// favicon.ico with embedded PNGs (supported by every current browser)
const sizes = [16, 32, 48];
const images = [];
for (const size of sizes) images.push(await render(svg, size));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
});
writeFileSync(
  join(publicDir, "favicon.ico"),
  Buffer.concat([header, ...images])
);
console.log("public/favicon.ico");

writeFileSync(join(publicDir, "favicon.svg"), svg);
console.log("public/favicon.svg");

await browser.close();
