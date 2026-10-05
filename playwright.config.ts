import { defineConfig, devices } from "@playwright/test";

const PAGES_BASE = "/reactive-volcano-app/";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  // In CI: failures as annotations on the pull request, plus the HTML report
  reporter: process.env.CI
    ? [["github"], ["list"], ["html", { open: "never" }]]
    : "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: "preview/**",
    },
    // The production build under the GitHub Pages base path: deep links,
    // service worker and offline start
    {
      name: "preview",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:4173${PAGES_BASE}`,
      },
      testMatch: "preview/**",
    },
    /*
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    */
  ],

  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: `npm run build && npx vite preview --base=${PAGES_BASE} --port 4173 --strictPort`,
      url: `http://localhost:4173${PAGES_BASE}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
    },
  ],
});
