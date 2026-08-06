/**
 * E2E integration tests: first-use route selector (Task #629).
 *
 * Covers the six key entry paths that determine whether the selector shows:
 *   1. Fresh storage (no localStorage)    → selector shown
 *   2. Legacy persisted state (no firstVisitComplete field) → selector shown
 *   3. Picking a route on the selector    → selector dismissed, tab active,
 *      firstVisitComplete + activeTab persisted to localStorage
 *   4. Returning user (firstVisitComplete === true) → selector skipped
 *   5. URL hash tab bypass (e.g. /#extract) → selector skipped
 *   6. Skip button                        → selector dismissed, Apply tab shown
 *
 * Strategy
 * --------
 *  - All tests use page.addInitScript() to set localStorage before React
 *    initialises, preventing any race between the hydration effect and
 *    the first React render.
 *  - The route selector heading ("What would you like to do?") and the tab
 *    navs are used as the primary visibility indicators.
 */

import { test, expect, type Page } from "@playwright/test";

const LS_KEY = "mtb.state.v1";
const FIRST_VISIT_KEY = "mtb.firstVisit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clear localStorage so the app treats this as a brand-new user. */
async function seedFreshState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Seed a specific persisted-state object before navigating.
 * Pass `markFirstVisitComplete: true` to also set the `mtb.firstVisit` key so
 * the route selector is bypassed (returning-user scenario).
 */
async function seedState(
  page: Page,
  state: Record<string, unknown>,
  opts?: { markFirstVisitComplete?: boolean }
): Promise<void> {
  await page.addInitScript(
    ({
      key,
      value,
      firstVisitKey,
      markFirstVisit,
    }: {
      key: string;
      value: string;
      firstVisitKey: string;
      markFirstVisit: boolean;
    }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, value);
      if (markFirstVisit) localStorage.setItem(firstVisitKey, "true");
    },
    {
      key: LS_KEY,
      value: JSON.stringify(state),
      firstVisitKey: FIRST_VISIT_KEY,
      markFirstVisit: opts?.markFirstVisitComplete ?? false,
    }
  );
}

/** Heading rendered by RouteSelector — present iff the selector is showing. */
const SELECTOR_HEADING = /What would you like to do/i;

/**
 * aria-label on the desktop tab nav.
 * NOTE: The nav uses `role="tablist"` explicitly, so Playwright sees it as a
 * tablist rather than a navigation landmark.
 */
const DESKTOP_NAV_NAME = "Mermaid Theme Builder sections";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("First-use route selector", () => {
  // ── 1. Fresh storage ──────────────────────────────────────────────────────

  test("fresh load (empty localStorage) shows the route selector", async ({ page }) => {
    await seedFreshState(page);
    await page.goto("/");
    await page.waitForLoadState("load");

    // Selector heading must become visible after hydration.
    await expect(page.getByRole("heading", { name: SELECTOR_HEADING })).toBeVisible({
      timeout: 8_000,
    });

    // Tab navigation must be hidden while selector is active.
    // The nav uses role="tablist" (explicit override of the semantic nav role).
    await expect(
      page.getByRole("tablist", { name: DESKTOP_NAV_NAME })
    ).toBeHidden({ timeout: 4_000 });
  });

  // ── 2. Legacy persisted state ─────────────────────────────────────────────

  test("legacy persisted state (no firstVisitComplete) also shows selector", async ({ page }) => {
    // Simulate a user whose localStorage pre-dates the first-use selector:
    // valid state blob but no firstVisitComplete field at all.
    await seedState(page, {
      schemaVersion: 1,
      selectedPaletteId: "okhp3",
      customColors: {},
      includeMetaComments: true,
      includeBadge: true,
      customThemeName: "",
      userPalettes: [],
      recentPaletteIds: [],
      activeTab: "compose",
      // NOTE: no firstVisitComplete field
    });
    await page.goto("/");
    await page.waitForLoadState("load");

    await expect(page.getByRole("heading", { name: SELECTOR_HEADING })).toBeVisible({
      timeout: 8_000,
    });
  });

  // ── 3. Picking a route ────────────────────────────────────────────────────

  test("picking 'Apply a Theme' dismisses selector and persists firstVisitComplete", async ({
    page,
  }) => {
    await seedFreshState(page);
    await page.goto("/");
    await page.waitForLoadState("load");

    // Wait for selector, then click the Apply card.
    await expect(page.getByRole("heading", { name: SELECTOR_HEADING })).toBeVisible({
      timeout: 8_000,
    });
    await page.getByRole("button", { name: /Apply a Theme/i }).click();

    // Selector must be gone and tab nav must be visible.
    await expect(page.getByRole("heading", { name: SELECTOR_HEADING })).not.toBeVisible({
      timeout: 4_000,
    });
    await expect(
      page.getByRole("tablist", { name: DESKTOP_NAV_NAME })
    ).toBeVisible({ timeout: 4_000 });

    // The first-visit key must be written immediately (before the auto-save
    // effect flushes the full state blob).
    const firstVisitFlag = await page.evaluate(
      (k: string) => localStorage.getItem(k),
      FIRST_VISIT_KEY
    );
    expect(firstVisitFlag, "mtb.firstVisit must be set immediately on route selection").toBe(
      "true"
    );

    // Wait for auto-save (save effect is gated on firstVisitComplete).
    await page.waitForTimeout(500);

    const raw = await page.evaluate((key: string) => localStorage.getItem(key), LS_KEY);
    expect(raw, "localStorage must be written after route selection").not.toBeNull();
    const saved = JSON.parse(raw!) as { firstVisitComplete?: boolean; activeTab?: string };
    expect(saved.firstVisitComplete).toBe(true);
    expect(saved.activeTab).toBe("apply");
  });

  // ── 4. Returning user ─────────────────────────────────────────────────────

  test("returning user (firstVisitComplete:true) skips the selector", async ({ page }) => {
    await seedState(
      page,
      {
        schemaVersion: 1,
        firstVisitComplete: true,
        activeTab: "apply",
        selectedPaletteId: "okhp3",
        customColors: {},
        includeMetaComments: true,
        includeBadge: true,
        customThemeName: "",
        userPalettes: [],
        recentPaletteIds: [],
      },
      { markFirstVisitComplete: true }
    );
    await page.goto("/");
    await page.waitForLoadState("load");

    // Selector heading must never appear.
    await expect(page.getByRole("heading", { name: SELECTOR_HEADING })).not.toBeVisible({
      timeout: 4_000,
    });

    // Tab nav must be visible (not suppressed).
    await expect(
      page.getByRole("tablist", { name: DESKTOP_NAV_NAME })
    ).toBeVisible({ timeout: 4_000 });
  });

  // ── 5. URL hash tab bypass ────────────────────────────────────────────────

  test("URL hash tab (e.g. /#extract) bypasses selector for new users", async ({ page }) => {
    await seedFreshState(page);
    // Navigate with a hash that names a known tab — the selector must be skipped.
    await page.goto("/#extract");
    await page.waitForLoadState("load");

    // Give the hydration effect time to run — selector must not appear.
    await expect(page.getByRole("heading", { name: SELECTOR_HEADING })).not.toBeVisible({
      timeout: 4_000,
    });
    await expect(
      page.getByRole("tablist", { name: DESKTOP_NAV_NAME })
    ).toBeVisible({ timeout: 4_000 });
  });

  // ── 6. Skip button ────────────────────────────────────────────────────────

  test("Skip button dismisses selector and lands on Apply tab", async ({ page }) => {
    await seedFreshState(page);
    await page.goto("/");
    await page.waitForLoadState("load");

    await expect(page.getByRole("heading", { name: SELECTOR_HEADING })).toBeVisible({
      timeout: 8_000,
    });
    await page.getByRole("button", { name: /Skip/i }).click();

    // Selector must be gone; tab nav visible.
    await expect(page.getByRole("heading", { name: SELECTOR_HEADING })).not.toBeVisible({
      timeout: 4_000,
    });
    await expect(
      page.getByRole("tablist", { name: DESKTOP_NAV_NAME })
    ).toBeVisible({ timeout: 4_000 });
  });

  // ── 7. Clear all settings re-triggers selector on next load ───────────────

  test("clearing all settings causes the selector to re-appear on the next page load", async ({
    page,
  }) => {
    // Do NOT use addInitScript here — addInitScript re-runs on every navigation
    // (including page.reload()), which would re-seed mtb.firstVisit and defeat
    // the test.  The playwright.config.ts storageState already seeds
    // mtb.firstVisit:"true" at context-creation time (not re-applied on reload),
    // which is enough to make this a returning-user scenario.
    await page.goto("/");
    await page.waitForLoadState("load");

    // Confirm selector is NOT shown for the returning user.
    await expect(page.getByRole("heading", { name: SELECTOR_HEADING })).not.toBeVisible({
      timeout: 6_000,
    });

    // Invoke "Clear all settings" via the settings menu.
    await page.getByRole("button", { name: /settings/i }).click();
    await page.getByRole("menuitem", { name: /clear all settings/i }).click();

    // Confirm mtb.firstVisit has been removed from localStorage.
    const fvAfterClear = await page.evaluate(() => localStorage.getItem("mtb.firstVisit"));
    expect(fvAfterClear).toBeNull();

    // Navigate to "/" (same as reload, but also avoids any browser-history
    // hash state from the current session).
    await page.goto("/");
    await page.waitForLoadState("load");

    await expect(page.getByRole("heading", { name: SELECTOR_HEADING })).toBeVisible({
      timeout: 8_000,
    });
  });
});
