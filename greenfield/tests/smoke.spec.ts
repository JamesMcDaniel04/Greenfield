import { test, expect } from "@playwright/test";

/**
 * Shell-rendering smoke tests.
 *
 * These run against the dev server with placeholder Supabase creds. They verify
 * that every route mounts and renders its chrome — they do NOT assert against
 * any backend-fetched content (since the backend is unreachable in this mode).
 */

test.describe("Public shell", () => {
  test("/ renders the hero and filter sidebar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Opportunities");
    await expect(page.getByPlaceholder(/Search opportunities/i)).toBeVisible();
    // Filter group headings
    await expect(page.getByText(/^Industry$/)).toBeVisible();
    await expect(page.getByText(/^Audience$/)).toBeVisible();
    await expect(page.getByText(/^Difficulty$/)).toBeVisible();
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

test.describe("Auth-gated redirects", () => {
  test("/saved redirects to /auth when signed out", async ({ page }) => {
    await page.goto("/saved");
    await expect(page).toHaveURL(/\/auth/);
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
