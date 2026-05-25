import { test, expect } from "@playwright/test";

/**
 * Shell-rendering smoke tests.
 *
 * These run against the dev server with placeholder Supabase creds. They verify
 * that every route mounts and renders its chrome — they do NOT assert against
 * any backend-fetched content (since the backend is unreachable in this mode).
 */

test.describe("Marketing landing (/)", () => {
  test("demo-mode banner renders when no .env", async ({ page }) => {
    await page.goto("/");
    // Multiple "Demo mode" matches exist (banner + FAQ answer); we just need the banner.
    await expect(page.getByText(/Demo mode/i).first()).toBeVisible();
  });

  test("hero, featured cards, pricing tiers, and FAQ all render", async ({ page }) => {
    await page.goto("/");
    // Hero
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/startup/i);
    await expect(page.getByRole("link", { name: /Browse the catalogue/i })).toBeVisible();
    // Featured opportunity (one of the fixture titles)
    await expect(page.getByRole("heading", { name: /Workflow OS for solo CPAs/i })).toBeVisible();
    // Pricing section
    await expect(page.getByRole("heading", { name: /^Starter$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Team$/ })).toBeVisible();
    await expect(page.getByText("$99")).toBeVisible();
    await expect(page.getByText("$350")).toBeVisible();
    // FAQ
    await expect(page.getByText(/Where do the opportunities come from/i)).toBeVisible();
  });

  test("top nav shows Sign in + Get started when signed out", async ({ page }) => {
    await page.goto("/");
    // Footer also has a Sign in link — scope to the header.
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: /^Sign in$/ })).toBeVisible();
    await expect(banner.getByRole("link", { name: /^Get started$/ })).toBeVisible();
  });

  test("clicking 'Browse the catalogue' navigates to /browse", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Browse the catalogue/i }).first().click();
    await expect(page).toHaveURL(/\/browse$/);
  });
});

test.describe("Catalogue (/browse)", () => {
  test("renders the hero and filter bar", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Opportunities");
    await expect(page.getByPlaceholder(/Search opportunities/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Industry$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Audience$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Difficulty$/ })).toBeVisible();
  });

  test("filter chip opens a menu with options", async ({ page }) => {
    await page.goto("/browse");
    await page.getByRole("button", { name: /^Difficulty$/ }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menu").getByText("Easy")).toBeVisible();
    await expect(page.getByRole("menu").getByText("Expert")).toBeVisible();
  });

  test("shows sample opportunity cards", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByRole("heading", { name: /Workflow OS for solo CPAs/i })).toBeVisible();
    await expect(page.getByText(/\d+ opportunities/i).first()).toBeVisible();
  });
});

test.describe("YC requests", () => {
  test("/yc-requests filters the catalogue to YC-seeded entries", async ({ page }) => {
    await page.goto("/yc-requests");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/YC/);
    await expect(page.getByRole("heading", { name: /immigration firm for startup/i })).toBeVisible();
  });
});

test.describe("Detail page", () => {
  test("opportunity detail renders all sections from fixtures", async ({ page }) => {
    await page.goto("/opportunity/solo-cpa-workflow-os");
    await expect(page.getByRole("heading", { level: 1, name: /Workflow OS for solo CPAs/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^The gap$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^The play$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Why now$/i })).toBeVisible();
  });
});

test.describe("Pricing", () => {
  test("/pricing shows Starter and Team tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /^Starter$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Team$/ })).toBeVisible();
    await expect(page.getByText("$99")).toBeVisible();
    await expect(page.getByText("$350")).toBeVisible();
    await expect(page.getByText("$0")).toHaveCount(0);
  });
});

test.describe("Auth", () => {
  test("/auth renders sign-in form by default", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  });

  test("/auth?mode=signup renders sign-up form", async ({ page }) => {
    await page.goto("/auth?mode=signup");
    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();
  });

  test("/auth toggles between sign-in and sign-up", async ({ page }) => {
    await page.goto("/auth?mode=signin");
    await page.getByRole("button", { name: /^Create one$/ }).click();
    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();
  });
});

test.describe("Auth-gated routes", () => {
  test("/saved shows demo-mode empty state when Supabase isn't configured", async ({ page }) => {
    await page.goto("/saved");
    await expect(page.getByRole("heading", { name: /Your saved opportunities/i })).toBeVisible();
    await expect(page.getByText(/Saved lists need an account/i)).toBeVisible();
  });

  test("/admin redirects to /auth when signed out", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe("Misc", () => {
  test("unknown route renders the 404", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Off the trail/i })).toBeVisible();
  });

  test("logo link returns to /", async ({ page }) => {
    await page.goto("/pricing");
    await page.getByRole("link", { name: /Greenfield/ }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });
});
