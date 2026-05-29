/**
 * E2E tests for browser history navigation between tabs (Task #344).
 *
 * The app uses URL hash routing (#apply, #examples, #compose, #reference) so
 * users can bookmark and share direct links to any tab.  A hashchange listener
 * in AppShell keeps React state in sync when the browser navigates via the
 * Back / Forward buttons.
 *
 * Scenario covered:
 *   Root → click Examples → click Apply → goBack() → must restore Examples
 *
 * If the hashchange listener is absent, goBack() changes the URL but leaves
 * the React activeTab as "apply", so the Examples tab content never renders —
 * this test would catch that regression.
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helper: extract the hash from the current page URL
// ---------------------------------------------------------------------------

function hashOf(url: string): string {
  try {
    return new URL(url).hash;
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Test: Back button restores the Examples tab after Apply → Examples → Apply
// ---------------------------------------------------------------------------

test("browser Back restores Examples tab after Apply → Examples → Apply navigation", async ({
  page,
}) => {
  // 1. Load the root URL — app defaults to Apply tab.
  await page.goto("/");
  await page.waitForLoadState("load");

  // Wait for the app shell to finish setting the initial hash.
  await page.waitForFunction(() => window.location.hash !== "");

  // Confirm we are on Apply (hash should be #apply after init).
  const initialHash = hashOf(page.url());
  expect(["#apply", "#"]).toContain(initialHash === "" ? "#" : initialHash);

  // 2. Navigate to Examples tab.
  await page.getByRole("tab", { name: "Examples" }).first().click();
  await page.waitForFunction(() => window.location.hash === "#examples");
  expect(hashOf(page.url())).toBe("#examples");

  // Sidebar must be populated.
  await page.waitForSelector("[data-example-id]", { timeout: 10_000 });
  await expect(page.locator("[data-example-id]").first()).toBeVisible();

  // 3. Navigate back to Apply tab.
  await page.getByRole("tab", { name: "Apply" }).first().click();
  await page.waitForFunction(() => window.location.hash === "#apply");
  expect(hashOf(page.url())).toBe("#apply");

  // 4. Press the browser Back button.
  await page.goBack();

  // URL hash must return to #examples.
  await page.waitForFunction(() => window.location.hash === "#examples", undefined, {
    timeout: 5_000,
  });
  expect(hashOf(page.url())).toBe("#examples");

  // 5. The Examples tab content must be visible — at least one sidebar entry.
  await page.waitForSelector("[data-example-id]", { timeout: 10_000 });
  await expect(page.locator("[data-example-id]").first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test: Forward button restores Apply tab after Back takes us to Examples
// ---------------------------------------------------------------------------

test("browser Forward restores Apply tab after Back → Forward cycle", async ({ page }) => {
  // 1. Load root → Apply tab.
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForFunction(() => window.location.hash !== "");

  // 2. Go to Examples.
  await page.getByRole("tab", { name: "Examples" }).first().click();
  await page.waitForFunction(() => window.location.hash === "#examples");

  // 3. Go to Apply.
  await page.getByRole("tab", { name: "Apply" }).first().click();
  await page.waitForFunction(() => window.location.hash === "#apply");

  // 4. Go Back → Examples.
  await page.goBack();
  await page.waitForFunction(() => window.location.hash === "#examples", undefined, {
    timeout: 5_000,
  });

  // 5. Go Forward → Apply.
  await page.goForward();
  await page.waitForFunction(() => window.location.hash === "#apply", undefined, {
    timeout: 5_000,
  });
  expect(hashOf(page.url())).toBe("#apply");

  // The Apply tab textarea (diagram code input) must be visible.
  await expect(page.getByRole("textbox", { name: /diagram code/i })).toBeVisible();
});
