import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (locale: string) =>
  JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<
    string,
    unknown
  >;
const en = read("en");
const de = read("de");
const keys = Object.keys(en).filter((k) => k !== "$schema");

/** Placeholders a message uses, over all variants. */
const placeholders = (v: unknown) =>
  [...new Set([...JSON.stringify(v).matchAll(/\{(\w+)\}/g)].map((m) => m[1]))]
    .sort()
    .join(",");

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory())
      return e.name === "paraglide" ? [] : files(join(dir, e.name));
    return /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [];
  });

describe("messages/*.json", () => {
  it("has every message in both languages, none empty, with the same placeholders", () => {
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
    const empty = keys.filter((k) =>
      [en[k], de[k]].some((v) => typeof v === "string" && !v.trim())
    );
    expect(empty).toEqual([]);
    const differ = keys.filter(
      (k) => placeholders(en[k]) !== placeholders(de[k])
    );
    expect(differ).toEqual([]);
  });

  it("every message is used, every used key exists", () => {
    const code = files("src")
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    // m.key() calls, plus keys passed around as strings (analysis findings)
    const used = new Set(
      [
        ...code.matchAll(/\bm\.(\w+)\(/g),
        ...code.matchAll(/"([a-z][A-Za-z0-9]*_[A-Za-z0-9_]+)"/g),
      ].map((m) => m[1])
    );
    expect(keys.filter((k) => !used.has(k))).toEqual([]);
    const called = [...code.matchAll(/\bm\.(\w+)\(/g)].map((m) => m[1]);
    expect(called.filter((k) => !(k in en))).toEqual([]);
  });
});
