/**
 * E2E tests for browser history navigation between tabs (Task #344).
 *
 * The app uses URL hash routing (#apply, #examples, #compose, #reference) so
 * users can bookmark and share direct links to any tab. A hashchange listener
 * in AppShell keeps React state in sync when the browser navigates via the
 * Back / Forward buttons.
 *
 * Scenario covered:
 *   Root -> click Examples -> click Apply -> goBack() -> must restore Examples
 *
 * If the hashchange listener is absent, goBack() changes the URL but leaves
 * the React activeTab as "apply", so the Examples tab content never renders.
 * This test catches that regression.
 */

import { test, expect } from "@playwright/test";

function hashOf(url: string): string {
  try {
    return new URL(url).hash;
  } catch {
    return "";
  }
}

test("browser Back restores Examples tab after Apply -> Examples -> Apply navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.goto("/");
  await page.waitForLoadState("load");
  await Promise.all([
    page.waitForURL((url) => url.hash === "#apply"),
    page.getByRole("tab", { name: "Apply" }).first().click(),
  ]);
  expect(hashOf(page.url())).toBe("#apply");

  await Promise.all([
    page.waitForURL((url) => url.hash === "#examples"),
    page.getByRole("tab", { name: "Examples" }).first().click(),
  ]);
  expect(hashOf(page.url())).toBe("#examples");

  await page.waitForSelector("[data-example-id]", { timeout: 10_000 });
  await expect(page.locator("[data-example-id]").first()).toBeVisible();

  await Promise.all([
    page.waitForURL((url) => url.hash === "#apply"),
    page.getByRole("tab", { name: "Apply" }).first().click(),
  ]);
  expect(hashOf(page.url())).toBe("#apply");

  await Promise.all([page.waitForURL((url) => url.hash === "#examples"), page.goBack()]);
  expect(hashOf(page.url())).toBe("#examples");

  await page.waitForSelector("[data-example-id]", { timeout: 10_000 });
  await expect(page.locator("[data-example-id]").first()).toBeVisible();
});

test("browser Forward restores Apply tab after Back -> Forward cycle", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.goto("/");
  await page.waitForLoadState("load");
  await Promise.all([
    page.waitForURL((url) => url.hash === "#apply"),
    page.getByRole("tab", { name: "Apply" }).first().click(),
  ]);

  await Promise.all([
    page.waitForURL((url) => url.hash === "#examples"),
    page.getByRole("tab", { name: "Examples" }).first().click(),
  ]);

  await Promise.all([
    page.waitForURL((url) => url.hash === "#apply"),
    page.getByRole("tab", { name: "Apply" }).first().click(),
  ]);

  await Promise.all([page.waitForURL((url) => url.hash === "#examples"), page.goBack()]);

  await Promise.all([page.waitForURL((url) => url.hash === "#apply"), page.goForward()]);
  expect(hashOf(page.url())).toBe("#apply");

  await expect(page.getByRole("textbox", { name: /diagram code/i })).toBeVisible();
});
