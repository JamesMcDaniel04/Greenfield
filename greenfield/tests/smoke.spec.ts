import { test, expect } from "@playwright/test";

/**
 * Shell-rendering smoke tests for the Learning / Certificates product.
 *
 * These run against the dev server with placeholder Supabase creds. They verify
 * that every surviving route mounts and renders its chrome — they do NOT assert
 * against backend-fetched content (the backend is unreachable in this mode, so
 * career data is served from the local seed in lib/careerSeed.ts).
 */

test.describe("Marketing landing (/)", () => {
  test("demo-mode banner renders when no .env", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Demo mode/i).first()).toBeVisible();
  });

  test("hero, projects, pricing, and FAQ all render", async ({ page }) => {
    await page.goto("/");
    // Hero
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/hired/i);
    await expect(page.getByRole("link", { name: /Start the track/i }).first()).toBeVisible();
    // One of the five seeded projects
    await expect(page.getByText(/RAG customer support chatbot/i).first()).toBeVisible();
    // Single Career pricing tier
    await expect(page.getByText("$199").first()).toBeVisible();
    // No ideas-era tiers
    await expect(page.getByText("$97")).toHaveCount(0);
    await expect(page.getByText("$197")).toHaveCount(0);
    await expect(page.getByText("$12,000")).toHaveCount(0);
    // FAQ rewritten for the learning product
    await expect(page.getByText(/How is the grading done/i)).toBeVisible();
  });

  test("top nav shows Sign in + Get started when signed out", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: /^Sign in$/ })).toBeVisible();
    await expect(banner.getByRole("link", { name: /^Get started$/ })).toBeVisible();
  });

  test("hero CTA navigates to signup", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Start the track/i }).first().click();
    await expect(page).toHaveURL(/\/auth\?mode=signup/);
  });
});

test.describe("Career track (/career)", () => {
  test("renders the seeded track + its projects", async ({ page }) => {
    await page.goto("/career");
    await expect(page.getByRole("heading", { name: /AI Automation Specialist/i }).first()).toBeVisible();
    await expect(page.getByText(/RAG customer support chatbot/i).first()).toBeVisible();
  });

  test("a track-detail route redirects to /auth when signed out", async ({ page }) => {
    await page.goto("/career/ai-automation-specialist");
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe("Pricing", () => {
  test("/pricing shows the single Career plan + University card", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /^Career$/ }).first()).toBeVisible();
    await expect(page.getByText("$199").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Universities & accelerators/i })).toBeVisible();
    // No ideas-era tiers
    await expect(page.getByText("$97")).toHaveCount(0);
    await expect(page.getByText("$12,000")).toHaveCount(0);
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

test.describe("Public portfolio (/portfolio/:username)", () => {
  test("shows the not-found state in demo mode", async ({ page }) => {
    await page.goto("/portfolio/somebody");
    await expect(page.getByRole("heading", { name: /Portfolio not found/i })).toBeVisible();
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
