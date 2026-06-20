/**
 * Playwright config for the route-level accessibility pass (PRD Stage 2/10). It builds nothing
 * itself: it starts the already-built site and runs the axe checks against sampled routes. Kept out
 * of the unit-test path (vitest); run with `pnpm --filter @nexoris/web test:a11y`.
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
