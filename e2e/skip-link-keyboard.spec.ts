import { test, expect } from "@playwright/test";

/**
 * Keyboard smoke test: Tab → skip link → Enter → #main-content
 *
 * Verifies that:
 *  1. The first Tab keypress from the page body focuses the skip link.
 *  2. Pressing Enter on the skip link moves focus to (or inside) #main-content.
 *
 * This complements the happy-dom unit tests in src/__tests__/accessibility.test.tsx
 * which can only assert DOM structure, not real browser focus behavior.
 */

test.describe("Skip link keyboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Tab focuses the skip link as the first focusable element", async ({ page }) => {
    await page.evaluate(() => document.body.focus());

    await page.keyboard.press("Tab");

    const activeHref = await page.evaluate(() => {
      const el = document.activeElement;
      return el instanceof HTMLAnchorElement ? el.getAttribute("href") : null;
    });

    expect(activeHref).toBe("#main-content");
  });

  test("Enter on the skip link moves focus to #main-content", async ({ page }) => {
    await page.evaluate(() => document.body.focus());

    await page.keyboard.press("Tab");

    const hrefAfterTab = await page.evaluate(() => {
      const el = document.activeElement;
      return el instanceof HTMLAnchorElement ? el.getAttribute("href") : null;
    });
    expect(hrefAfterTab).toBe("#main-content");

    await page.keyboard.press("Enter");

    const focusedId = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      if (el.id === "main-content") return "main-content";
      if (el.closest("#main-content")) return "inside-main-content";
      return el.id || el.tagName.toLowerCase();
    });

    expect(
      ["main-content", "inside-main-content"].includes(focusedId ?? ""),
      `Expected focus on #main-content or a descendant, got: ${focusedId}`
    ).toBe(true);
  });
});
