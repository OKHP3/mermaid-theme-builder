/**
 * End-to-end tests for Examples tab scroll-restore behavior (Task #130 / Task #203 / Task #264 / Task #265).
 *
 * When a persisted lastSelectedExampleId is loaded from localStorage, the
 * sidebar must scroll that item into view before the user sees it. Without the
 * scrollIntoView call, items deep in the list would be restored as selected but
 * invisible, requiring the user to manually scroll to find them.
 *
 * Four scenarios are covered:
 *   1. A first-section item ("OKHP3 Brand") — always near the top; verifies
 *      the no-scroll path does not break visibility.
 *   2. A deep "Specialty" section item that appears many sidebar entries below
 *      the fold — verifies that scrollIntoView fires and brings it on screen.
 *   3. (Negative) Fresh start with no persisted selection — user scrolls deep
 *      then clicks an item; sidebar scrollTop must NOT jump (pendingScrollIdRef
 *      is null so no auto-scroll fires, preserving the user's browse position).
 *   4. Deep-link via #examples hash — localStorage is pre-seeded with
 *      addInitScript() before first navigation so ExamplesTab mounts on first
 *      render rather than after a tab click; scroll restore must still fire.
 *
 * The sidebar is a fixed-height overflow-y:auto container. An element that has
 * not been scrolled into view is clipped by the container and does not
 * intersect the browser viewport, so Playwright's toBeInViewport() correctly
 * distinguishes "scrolled into view" from "still off-screen".
 *
 * The app runs at BASE_URL (default: http://localhost:80/mermaid-theme-builder/).
 * Set PLAYWRIGHT_BASE_URL to override.
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants matching the production source
// ---------------------------------------------------------------------------

const LS_KEY = "mtb.state.v1";

/**
 * The first item in the sidebar list: first brand palette flowchart example.
 * ID mirrors the pattern `brand-${BRAND_PALETTES[0].id}-flow` in ExamplesTab.
 */
const FIRST_SECTION_ID = "brand-overkill-hill-flow";

/**
 * A deep item in the "Specialty" section — the last entry in EXAMPLE_CATALOG.
 * This sits several sections below the brand examples and is well off-screen in
 * a standard viewport without scrolling.
 */
const DEEP_ITEM_ID = "ishikawa-render-failure";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal valid persisted state object and set lastSelectedExampleId
 * to the given id, then navigate to the page so it hydrates from localStorage.
 */
async function injectPersistedIdAndReload(page: Page, exampleId: string): Promise<void> {
  // Navigate first so localStorage is accessible for this origin.
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const existingRaw: string | null = await page.evaluate(
    (key: string) => localStorage.getItem(key),
    LS_KEY
  );

  let base: Record<string, unknown> = {
    schemaVersion: 1,
    selectedPaletteId: "overkill-hill",
    customColors: {},
    includeMetaComments: true,
    includeBadge: true,
    customThemeName: "",
    inputCode: "flowchart TD\n  A --> B",
    userPalettes: [],
    recentPaletteIds: [],
  };

  if (existingRaw) {
    try {
      base = { ...base, ...JSON.parse(existingRaw) };
    } catch {
      // use default base
    }
  }

  const state = { ...base, lastSelectedExampleId: exampleId };
  await page.evaluate(
    ([key, value]: [string, string]) => localStorage.setItem(key, value),
    [LS_KEY, JSON.stringify(state)]
  );

  // Reload so the app hydrates from the injected state.
  await page.reload();
  await page.waitForLoadState("networkidle");
}

/**
 * Open the Examples tab and wait for the sidebar to render.
 * After a restore, the tab URL hash may already point to #examples; clicking
 * the nav button is safe even then.
 */
async function openExamplesTab(page: Page): Promise<void> {
  const hash = new URL(page.url()).hash;
  if (hash !== "#examples") {
    await page.getByRole("button", { name: "Examples" }).click();
  }
  // Wait for at least one sidebar entry to be present.
  await page.waitForSelector("[data-example-id]", { timeout: 10000 });
}

// ---------------------------------------------------------------------------
// Test 1: first-section item is visible on restore (no-scroll path)
// ---------------------------------------------------------------------------

test("restoring a first-section example keeps it visible without scrolling", async ({ page }) => {
  await injectPersistedIdAndReload(page, FIRST_SECTION_ID);
  await openExamplesTab(page);

  const btn = page.locator(`[data-example-id="${FIRST_SECTION_ID}"]`);
  await btn.waitFor({ state: "attached", timeout: 8000 });

  // The button must carry the selected class.
  await expect(btn).toHaveClass(/bg-primary\/10/);

  // The button must be visible in the browser viewport (it is near the top).
  await expect(btn).toBeInViewport();
});

// ---------------------------------------------------------------------------
// Test 2: deep specialty item is scrolled into view on restore
// ---------------------------------------------------------------------------

test("restoring a deep specialty example scrolls it into view", async ({ page }) => {
  await injectPersistedIdAndReload(page, DEEP_ITEM_ID);
  await openExamplesTab(page);

  const btn = page.locator(`[data-example-id="${DEEP_ITEM_ID}"]`);
  await btn.waitFor({ state: "attached", timeout: 8000 });

  // The button must carry the selected class confirming the restore succeeded.
  await expect(btn).toHaveClass(/bg-primary\/10/);

  // The button must be in the viewport — i.e., scrollIntoView fired and
  // brought it from below the fold into the visible sidebar area.
  // Without the scrollIntoView call this assertion would fail because the
  // element is clipped by the sidebar's overflow container.
  await expect(btn).toBeInViewport();
});

// ---------------------------------------------------------------------------
// Test 3 (negative): user click after fresh start must NOT auto-scroll sidebar
// ---------------------------------------------------------------------------

test("user click after fresh start does not auto-scroll the sidebar", async ({ page }) => {
  // Navigate and clear any persisted lastSelectedExampleId so no scroll
  // restore will be queued (pendingScrollIdRef stays null throughout).
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.evaluate((key: string) => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      delete state.lastSelectedExampleId;
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore malformed state
    }
  }, LS_KEY);

  await page.reload();
  await page.waitForLoadState("networkidle");

  // Open the Examples tab and wait for sidebar entries to render.
  await page.getByRole("button", { name: "Examples" }).click();
  await page.waitForSelector("[data-example-id]", { timeout: 10000 });

  // The sidebar is the overflow-y-auto container that wraps all example
  // buttons. It is the only such container that has [data-example-id] descendants.
  const sidebar = page.locator("div.overflow-y-auto:has([data-example-id])");

  // Bring the deep item into view to simulate the user having scrolled down
  // into the Specialty section. scrollIntoViewIfNeeded scrolls the sidebar
  // container (not the browser window) just enough to reveal the element.
  const deepBtn = page.locator(`[data-example-id="${DEEP_ITEM_ID}"]`);
  await deepBtn.waitFor({ state: "attached", timeout: 8000 });
  await deepBtn.scrollIntoViewIfNeeded();

  // Allow the scroll to settle, then record the user-controlled position.
  await page.waitForTimeout(150);
  const scrollTopBefore = await sidebar.evaluate((el: Element) => el.scrollTop);

  // Sanity: the user must actually have scrolled past the top (otherwise the
  // test is not exercising anything interesting).
  expect(scrollTopBefore).toBeGreaterThan(0);

  // User clicks the deep item. Because pendingScrollIdRef is null (no restore
  // was ever queued), the useEffect that calls scrollIntoView returns early —
  // the sidebar position must not jump.
  await deepBtn.click();

  // Allow React to re-render and any effects to settle.
  await page.waitForTimeout(300);
  const scrollTopAfter = await sidebar.evaluate((el: Element) => el.scrollTop);

  // Drift must be negligible: the sidebar must stay where the user left it.
  const drift = Math.abs(scrollTopAfter - scrollTopBefore);
  expect(drift).toBeLessThan(50);
});

// ---------------------------------------------------------------------------
// Test 4: deep-link (#examples hash) still restores scroll on first render
// ---------------------------------------------------------------------------

test("deep-link to #examples restores scroll when ExamplesTab mounts on first render", async ({
  page,
}) => {
  // Build the persisted state with a deep lastSelectedExampleId.
  const state: Record<string, unknown> = {
    schemaVersion: 1,
    selectedPaletteId: "overkill-hill",
    customColors: {},
    includeMetaComments: true,
    includeBadge: true,
    customThemeName: "",
    inputCode: "flowchart TD\n  A --> B",
    userPalettes: [],
    recentPaletteIds: [],
    lastSelectedExampleId: DEEP_ITEM_ID,
  };

  // addInitScript injects a script that runs before any page script on every
  // navigation — localStorage is already populated when React hydrates.
  // This replicates the deep-link timing path: ExamplesTab mounts immediately
  // on the first render (hash is already #examples) rather than mounting only
  // after the user clicks the nav button from another tab.
  await page.addInitScript(
    ([key, value]: [string, string]) => {
      localStorage.setItem(key, value);
    },
    [LS_KEY, JSON.stringify(state)]
  );

  // Navigate directly to the #examples URL hash — bypasses the Apply-tab-first
  // path and mounts ExamplesTab on the very first render cycle.
  await page.goto("/#examples");
  await page.waitForLoadState("networkidle");

  // Wait for sidebar entries to be present (same guard as other tests).
  await page.waitForSelector("[data-example-id]", { timeout: 10000 });

  const btn = page.locator(`[data-example-id="${DEEP_ITEM_ID}"]`);
  await btn.waitFor({ state: "attached", timeout: 8000 });

  // The restored selection must be highlighted.
  await expect(btn).toHaveClass(/bg-primary\/10/);

  // The restored item must be scrolled into view even under the deep-link
  // timing path where hydration and first mount overlap.
  await expect(btn).toBeInViewport();
});
