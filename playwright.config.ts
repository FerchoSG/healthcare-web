import { defineConfig, devices } from "@playwright/test";

const frontendPort = Number(process.env.E2E_FRONTEND_PORT ?? 3000);
const backendPort = Number(process.env.E2E_BACKEND_PORT ?? 3001);
const startServers = process.env.E2E_START_SERVERS === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${frontendPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: startServers
    ? [
        {
          command: "npm.cmd run start:dev",
          cwd: "../healthcare-api",
          url: `http://localhost:${backendPort}/public/clinics/clinica-demo`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: `npm.cmd run dev -- --port ${frontendPort}`,
          url: `http://localhost:${frontendPort}`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ]
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
