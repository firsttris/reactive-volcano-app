import { defineConfig, devices } from "@playwright/test";

// Renders the screenshots in docs/ against the Bluetooth mock:
// npm run screenshots
export default defineConfig({
  testDir: "./scripts",
  testMatch: "screenshots.spec.ts",
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Pixel 7"],
    baseURL: "http://localhost:5173",
    locale: "en-US",
    colorScheme: "dark",
    // Optional: a locally installed Chromium instead of the bundled one
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
