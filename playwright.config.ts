import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3011",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3011",
    url: "http://localhost:3011",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // NextAuth builds absolute redirect URLs from NEXTAUTH_URL, which in .env is pinned to
    // the port used for everyday `npm run dev`. Override it here so credential-based sign-in
    // redirects land back on the actual port this test server is running on.
    env: {
      NEXTAUTH_URL: "http://localhost:3011",
    },
  },
});
