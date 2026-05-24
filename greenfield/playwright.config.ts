import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests for Greenfield.
 *
 * Boots the Vite dev server with placeholder Supabase env vars so the client
 * constructs without crashing. Data-backed pages will render empty/error states
 * (which is what we assert) — this is a shell-rendering smoke test, NOT an E2E
 * test against a real Supabase project.
 *
 * For full E2E with real data, set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in
 * your environment before running and the config will pass them through.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // Use port 5174 so we don't collide with a running `npm run dev`.
    command: "npm run dev -- --port 5174 --strictPort",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co",
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key",
    },
  },
});
