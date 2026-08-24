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
    localStorage.setItem("mtb.firstVisit", "true");
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
    localStorage.setItem("mtb.firstVisit", "true");
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

test("direct #extract URL selects the Extract tab", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
    window.sessionStorage.clear();
  });

  await page.goto("/#extract");
  await page.waitForLoadState("load");

  expect(hashOf(page.url())).toBe("#extract");
  await expect(page.getByRole("tab", { name: "Extract" }).first()).toHaveAttribute(
    "aria-selected",
    "true"
  );
});

test("browser Back restores Apply after #apply -> #extract navigation", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
    window.sessionStorage.clear();
  });

  await page.goto("/#apply");
  await page.waitForLoadState("load");
  await expect(page.getByRole("tab", { name: "Apply" }).first()).toHaveAttribute(
    "aria-selected",
    "true"
  );

  await Promise.all([
    page.waitForURL((url) => url.hash === "#extract"),
    page.getByRole("tab", { name: "Extract" }).first().click(),
  ]);
  await expect(page.getByRole("tab", { name: "Extract" }).first()).toHaveAttribute(
    "aria-selected",
    "true"
  );

  await Promise.all([page.waitForURL((url) => url.hash === "#apply"), page.goBack()]);
  await expect(page.getByRole("tab", { name: "Apply" }).first()).toHaveAttribute(
    "aria-selected",
    "true"
  );
});
