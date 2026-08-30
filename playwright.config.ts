import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;
const isCI = Boolean(
  (globalThis as { process?: { env?: { CI?: string } } }).process?.env?.CI
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 0,
  workers: isCI ? 1 : undefined,
  reporter: [
    [isCI ? "line" : "list"],
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
