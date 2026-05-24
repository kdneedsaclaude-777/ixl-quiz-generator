import { defineConfig, devices } from "@playwright/test";

// E2E runs against an isolated test DB on port 3100 so it can never disturb
// the demo server (port 3000) or prisma/dev.db.
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Prep the isolated test DB then boot the server in one command, so the
  // schema + seed exist before Playwright's readiness probe hits the
  // DB-backed landing page. Scoped entirely to prisma/test.db.
  webServer: {
    command: `DATABASE_URL="file:./test.db" PORT=${PORT} sh -c "rm -f prisma/test.db prisma/test.db-journal && npx prisma db push --skip-generate --accept-data-loss && npx tsx prisma/seed.ts && npm run dev"`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
