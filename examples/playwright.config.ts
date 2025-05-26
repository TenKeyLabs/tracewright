import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Retry on CI only.
  retries: 1,
  // Reporter to use
  reporter: "list",
  use: {
    trace: "on-first-retry",
  },
  timeout: 10 * 60 * 1000,
  // Configure projects for major browsers.
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: false,
        viewport: { width: 1920, height: 1080 },
        actionTimeout: 5 * 1000,
      },
    },
  ],
});
