import { test } from "@playwright/test";

/**
 * Generates screenshots into ./screenshots/ for documentation.
 * Run with: npx playwright test tests/screenshots.spec.ts
 */

const PAGES = [
  { name: "01-landing",           path: "/" },
  { name: "02-browse",            path: "/browse" },
  { name: "03-detail",            path: "/opportunity/solo-cpa-workflow-os" },
  { name: "04-yc-requests",       path: "/yc-requests" },
  { name: "05-pricing",           path: "/pricing" },
  { name: "06-auth-signin",       path: "/auth?mode=signin" },
  { name: "07-auth-signup",       path: "/auth?mode=signup" },
  { name: "08-not-found",         path: "/this-route-does-not-exist" },
];

for (const p of PAGES) {
  test(`screenshot ${p.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(p.path);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `screenshots/${p.name}.png`, fullPage: true });
  });
}
