import { test, expect } from "@playwright/test";

/**
 * Shell-rendering smoke tests.
 *
 * These run against the dev server with placeholder Supabase creds. They verify
 * that every route mounts and renders its chrome — they do NOT assert against
 * any backend-fetched content (since the backend is unreachable in this mode).
 */

test.describe("Public shell", () => {
  test("demo-mode banner renders when no .env", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Demo mode/i)).toBeVisible();
  });

  test("/ renders the hero and filter bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Opportunities");
    await expect(page.getByPlaceholder(/Search opportunities/i)).toBeVisible();
    // Filter chip buttons
    await expect(page.getByRole("button", { name: /^Industry$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Audience$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Difficulty$/ })).toBeVisible();
  });

  test("filter chip opens a menu with options", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Difficulty$/ }).click();
    // The Radix menu portals the options into the page; assert they appear.
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menu").getByText("Easy")).toBeVisible();
    await expect(page.getByRole("menu").getByText("Expert")).toBeVisible();
  });

  test("/ shows sample opportunity cards in demo mode", async ({ page }) => {
    await page.goto("/");
    // One of our fixture titles should appear
    await expect(page.getByRole("heading", { name: /Workflow OS for solo CPAs/i })).toBeVisible();
    // Card count text
    await expect(page.getByText(/12 opportunities/i)).toBeVisible();
  });

  test("opportunity detail page renders from fixtures", async ({ page }) => {
    await page.goto("/opportunity/solo-cpa-workflow-os");
    await expect(page.getByRole("heading", { level: 1, name: /Workflow OS for solo CPAs/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^The gap$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^The play$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Why now$/i })).toBeVisible();
  });

  test("/pricing shows Free and Pro tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /^Pricing$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Free$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Pro$/ })).toBeVisible();
    await expect(page.getByText("$0")).toBeVisible();
    await expect(page.getByText("$24")).toBeVisible();
  });

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

  test("unknown route renders the 404", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Off the trail/i })).toBeVisible();
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

test.describe("Header navigation", () => {
  test("logo link returns to /", async ({ page }) => {
    await page.goto("/pricing");
    await page.getByRole("link", { name: /Greenfield/ }).first().click();
    await expect(page).toHaveURL("http://localhost:5174/");
  });

  test("signed-out header shows Sign in + Get started", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Get started/i })).toBeVisible();
  });
});
