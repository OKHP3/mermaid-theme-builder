import { test, expect } from "@playwright/test";

/**
 * Landmark Tab-order guard.
 *
 * Tabs through the first 35 focus stops from the document body and asserts
 * that every structural landmark is represented in the keyboard sequence:
 *
 *  1. Skip link is the first focusable element.
 *  2. The active nav tab (role=tab, aria-selected=true) is reachable.
 *  3. At least one element inside #main-content is reachable (i.e. the
 *     active tab panel's interactive content is not isolated from Tab order).
 *  4. At least one footer link is reachable on desktop (the footer is
 *     visible at md+ breakpoints — the test uses the default 1280x720
 *     Desktop Chrome viewport from playwright.config.ts).
 *
 * This complements the axe-core unit tests (which only check DOM structure)
 * and the skip-link-keyboard spec (which only checks the skip-link + Enter
 * activation). If any landmark vanishes from Tab order due to a future CSS
 * or tabIndex change, this test will catch it.
 */

/** Metadata about the currently focused element. */
interface TabStop {
  tagName: string;
  id: string | null;
  role: string | null;
  ariaSelected: string | null;
  href: string | null;
  inHeader: boolean;
  inNav: boolean;
  inMain: boolean;
  inFooter: boolean;
  ariaLabel: string | null;
}

/**
 * Press Tab `count` times and return the focused-element metadata after
 * each press. Stops early if focus returns to <body> (full cycle).
 */
async function collectTabStops(
  page: import("@playwright/test").Page,
  count: number,
): Promise<TabStop[]> {
  const stops: TabStop[] = [];
  for (let i = 0; i < count; i++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate((): TabStop | null => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) {
        return null;
      }
      return {
        tagName: el.tagName.toLowerCase(),
        id: el.id || null,
        role: el.getAttribute("role"),
        ariaSelected: el.getAttribute("aria-selected"),
        href:
          el instanceof HTMLAnchorElement ? el.getAttribute("href") : null,
        inHeader: !!el.closest("header"),
        inNav: !!el.closest('nav[role="tablist"]'),
        inMain: !!el.closest("#main-content"),
        inFooter: !!el.closest("footer"),
        ariaLabel: el.getAttribute("aria-label"),
      };
    });
    if (stop === null) break;
    stops.push(stop);
  }
  return stops;
}

test.describe("Landmark Tab-order guard", () => {
  let stops: TabStop[];

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Start from a neutral position: focus the document body so Tab 1
    // lands on the first focusable child (the skip link).
    await page.evaluate(() => document.body.focus());
    stops = await collectTabStops(page, 35);
  });

  test("skip link is the first Tab stop", async () => {
    expect(stops.length).toBeGreaterThan(0);
    const first = stops[0];
    expect(first.tagName).toBe("a");
    expect(first.href).toBe("#main-content");
  });

  test("active nav tab is reachable by Tab", async () => {
    const activeNavTab = stops.find(
      (s) => s.inNav && s.role === "tab" && s.ariaSelected === "true",
    );
    expect(
      activeNavTab,
      `Expected an active nav tab (role=tab aria-selected=true inside nav[role=tablist]) ` +
        `to appear in the first ${stops.length} Tab stops.\n` +
        `Stops reached:\n${stops.map((s, i) => `  ${i + 1}. <${s.tagName}> id=${s.id} role=${s.role} ariaSelected=${s.ariaSelected} inNav=${s.inNav}`).join("\n")}`,
    ).toBeDefined();
  });

  test("at least one element inside #main-content is reachable by Tab", async () => {
    const mainStop = stops.find((s) => s.inMain);
    expect(
      mainStop,
      `Expected at least one Tab stop inside #main-content within the first ${stops.length} Tab stops.\n` +
        `Stops reached:\n${stops.map((s, i) => `  ${i + 1}. <${s.tagName}> id=${s.id} inMain=${s.inMain} inNav=${s.inNav}`).join("\n")}`,
    ).toBeDefined();
  });

  test("at least one footer link is reachable by Tab", async () => {
    const footerStop = stops.find((s) => s.inFooter);
    expect(
      footerStop,
      `Expected at least one Tab stop inside <footer> within the first ${stops.length} Tab stops.\n` +
        `Stops reached:\n${stops.map((s, i) => `  ${i + 1}. <${s.tagName}> id=${s.id} inFooter=${s.inFooter}`).join("\n")}`,
    ).toBeDefined();
  });
});
