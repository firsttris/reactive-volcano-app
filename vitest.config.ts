import { defineConfig } from "vitest/config";

export default defineConfig({
  // Solid's browser build, so effects and onMount run in tests
  resolve: { conditions: ["browser", "development"] },
  ssr: { resolve: { conditions: ["browser", "development"] } },
  test: {
    globals: true,
    server: { deps: { inline: [/solid-js/] } },
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "scripts/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.config.ts",
        "**/*.d.ts",
        "**/types.ts",
      ],
    },
  },
});
