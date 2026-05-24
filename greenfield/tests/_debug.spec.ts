import { test } from "@playwright/test";

test("dump console + DOM for /", async ({ page }) => {
  page.on("console", (m) => console.log(`[BROWSER ${m.type()}]`, m.text()));
  page.on("pageerror", (e) => console.log(`[BROWSER ERROR]`, e.message, e.stack));
  await page.goto("/");
  await page.waitForTimeout(2000);
  const html = await page.content();
  console.log("=== ROOT INNERHTML (first 800) ===");
  const root = await page.locator("#root").innerHTML();
  console.log(root.slice(0, 800));
  console.log("=== TITLE ===", await page.title());
  console.log("=== FULL HTML LENGTH ===", html.length);
});
