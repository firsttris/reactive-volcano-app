/**
 * Writes a gzip copy next to every compressible file in dist/, so nginx can
 * serve it with `gzip_static on` instead of compressing on every request.
 *
 *   node scripts/precompress.mjs [dir]
 *
 * Used by the Dockerfile only; GitHub Pages compresses on its own. No Brotli:
 * the nginx image has no Brotli module.
 */
import {
  readdirSync,
  readFileSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { extname, join } from "node:path";
import { constants, gzipSync } from "node:zlib";

const dir = process.argv[2] ?? "dist";
const extensions = new Set([
  ".html",
  ".js",
  ".css",
  ".json",
  ".webmanifest",
  ".svg",
  ".ico",
  ".txt",
]);
// Same threshold as gzip_min_length in nginx.conf
const minSize = 1024;

let original = 0;
let compressed = 0;
let count = 0;

const walk = (path) => {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    if (!extensions.has(extname(entry.name))) continue;
    const data = readFileSync(file);
    if (data.length < minSize) continue;
    const gz = gzipSync(data, { level: constants.Z_BEST_COMPRESSION });
    if (gz.length >= data.length) continue;
    writeFileSync(`${file}.gz`, gz);
    // Same mtime, so Last-Modified and ETag match the uncompressed file
    const { atime, mtime } = statSync(file);
    utimesSync(`${file}.gz`, atime, mtime);
    original += data.length;
    compressed += gz.length;
    count += 1;
  }
};

walk(dir);
console.log(
  `precompress: ${count} files, ${(original / 1024).toFixed(0)} KiB -> ${(compressed / 1024).toFixed(0)} KiB gzip`
);
