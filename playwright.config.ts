import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    [process.env.CI ? "line" : "list"],
    ["html", { outputFolder: "playwright-report", open: "never" }]
  ],
  outputDir: "test-results",
  use: {
    baseURL,
    locale: "zh-TW",
    screenshot: "only-on-failure",
    serviceWorkers: "block",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], browserName: "chromium" }
    }
  ],
  webServer: {
    command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${port} --strictPort`,
    reuseExistingServer: false,
    timeout: 180_000,
    url: baseURL
  }
});
