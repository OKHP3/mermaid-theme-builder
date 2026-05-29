import { test, expect, type Page } from "@playwright/test";

/**
 * Tab bar arrow-key navigation guard (Task #378).
 *
 * Verifies the roving-tabindex keyboard pattern on the desktop nav tablist.
 * The onKeyDown handler lives on the <nav role="tablist"> element and responds
 * to ArrowLeft, ArrowRight, Home, and End. After updating React state it uses
 * requestAnimationFrame to move browser focus to the newly active tab.
 *
 * All tests run at the default 1280×720 Desktop Chrome viewport, where the
 * desktop tablist (hidden md:flex) is visible and the mobile nav (md:hidden)
 * is hidden. The selector below scopes to the desktop tablist only.
 */

/** CSS selector for all tab buttons in the desktop nav tablist. */
const TAB_SEL =
  'nav[role="tablist"][aria-label="Mermaid Theme Builder sections"] [role="tab"]';

/**
 * Wait until the tab at position `idx` has aria-selected=true AND has
 * keyboard focus. The RAF in the onKeyDown handler means focus lands
 * slightly after the React state update, so we poll for both independently.
 */
async function waitForTabFocused(page: Page, idx: number): Promise<void> {
  await page.waitForFunction(
    ({ sel, i }: { sel: string; i: number }) =>
      document.querySelectorAll(sel)[i]?.getAttribute("aria-selected") === "true",
    { sel: TAB_SEL, i: idx },
  );
  await page.waitForFunction(
    ({ sel, i }: { sel: string; i: number }) =>
      document.activeElement === document.querySelectorAll(sel)[i],
    { sel: TAB_SEL, i: idx },
  );
}

test.describe("Tab bar arrow-key navigation — desktop tablist", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ── Arrow Right ───────────────────────────────────────────────────────────

  test("Arrow Right moves focus to the next tab and marks it aria-selected", async ({
    page,
  }) => {
    const tabCount = await page.locator(TAB_SEL).count();
    expect(tabCount, "desktop tablist must have at least 2 tabs").toBeGreaterThan(1);

    // Find the initial active tab index.
    const startIdx = await page.evaluate(
      (sel) =>
        Array.from(document.querySelectorAll(sel)).findIndex(
          (t) => t.getAttribute("aria-selected") === "true",
        ),
      TAB_SEL,
    );
    expect(startIdx, "a tab must be aria-selected=true on load").toBeGreaterThanOrEqual(0);

    // Focus the active tab (already in Tab order via tabIndex=0).
    await page.locator(`${TAB_SEL}[aria-selected="true"]`).focus();

    await page.keyboard.press("ArrowRight");

    const nextIdx = (startIdx + 1) % tabCount;
    await waitForTabFocused(page, nextIdx);

    await expect(page.locator(TAB_SEL).nth(nextIdx)).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  // ── Arrow Right wraps (last → first) ─────────────────────────────────────

  test("Arrow Right from the last tab wraps around to the first tab", async ({ page }) => {
    const tabCount = await page.locator(TAB_SEL).count();

    // Click the last tab to make it active + focused.
    await page.locator(TAB_SEL).last().click();
    await waitForTabFocused(page, tabCount - 1);

    await page.keyboard.press("ArrowRight");

    await waitForTabFocused(page, 0);
    await expect(page.locator(TAB_SEL).first()).toHaveAttribute("aria-selected", "true");
  });

  // ── Arrow Left wraps (first → last) ──────────────────────────────────────

  test("Arrow Left from the first tab wraps to the last tab", async ({ page }) => {
    const tabCount = await page.locator(TAB_SEL).count();

    // Navigate to the first tab.
    await page.locator(TAB_SEL).first().click();
    await waitForTabFocused(page, 0);

    await page.keyboard.press("ArrowLeft");

    await waitForTabFocused(page, tabCount - 1);
    await expect(page.locator(TAB_SEL).last()).toHaveAttribute("aria-selected", "true");
  });

  // ── Home key ─────────────────────────────────────────────────────────────

  test("Home key jumps to the first tab from any non-first position", async ({ page }) => {
    const tabCount = await page.locator(TAB_SEL).count();

    // Start from the last tab.
    await page.locator(TAB_SEL).last().click();
    await waitForTabFocused(page, tabCount - 1);

    await page.keyboard.press("Home");

    await waitForTabFocused(page, 0);
    await expect(page.locator(TAB_SEL).first()).toHaveAttribute("aria-selected", "true");
  });

  // ── End key ───────────────────────────────────────────────────────────────

  test("End key jumps to the last tab from any non-last position", async ({ page }) => {
    const tabCount = await page.locator(TAB_SEL).count();

    // Start from the first tab.
    await page.locator(TAB_SEL).first().click();
    await waitForTabFocused(page, 0);

    await page.keyboard.press("End");

    await waitForTabFocused(page, tabCount - 1);
    await expect(page.locator(TAB_SEL).last()).toHaveAttribute("aria-selected", "true");
  });
});
