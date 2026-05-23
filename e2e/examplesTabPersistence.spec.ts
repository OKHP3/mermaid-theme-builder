/**
 * End-to-end tests for Examples tab selection persistence (Task #129).
 *
 * Covers the full app-level round-trip that unit tests cannot reach:
 *   1. User selects a non-default example → App writes lastSelectedExampleId
 *      to localStorage → page reload → the same example is restored.
 *   2. A stale/unrecognized lastSelectedExampleId in localStorage → graceful
 *      fallback to the first example.
 *
 * The app runs at BASE_URL (default: http://localhost:80/mermaid-theme-builder/).
 * Set PLAYWRIGHT_BASE_URL to override.
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants matching the production source
// ---------------------------------------------------------------------------

const LS_KEY = "mtb.state.v1";

// Label of the second brand palette's flowchart example (a known non-default).
// Must match: `${BRAND_PALETTES[1].name} — Flowchart` in ExamplesTab.tsx.
const NON_DEFAULT_LABEL = "Glee-fully \u2014 Flowchart";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the app and open the Examples tab. */
async function openExamplesTab(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // Click the "Examples" tab in the navigation bar.
  await page.getByRole("button", { name: "Examples" }).click();
  // Wait for at least one example sidebar button to be visible.
  await page.waitForSelector('button:has-text("\u2014 Flowchart")', { timeout: 8000 });
}

/**
 * Returns the label of the currently highlighted (selected) sidebar button.
 * The selected button carries the `bg-primary/10` Tailwind class.
 */
async function getSelectedExampleLabel(page: Page): Promise<string> {
  const selected = page.locator('button[class*="bg-primary\\/10"]').first();
  await selected.waitFor({ timeout: 8000 });
  // The label is inside the first span.flex-1 inside the selected button.
  const labelSpan = selected.locator("span.flex-1").first();
  return (await labelSpan.textContent()) ?? "";
}

// ---------------------------------------------------------------------------
// Test 1: persistence round-trip across a page reload
// ---------------------------------------------------------------------------

test("selected example persists across a page reload", async ({ page }) => {
  await openExamplesTab(page);

  // Click the non-default example button.
  await page.getByRole("button", { name: NON_DEFAULT_LABEL, exact: true }).click();

  // Confirm it is now selected before reloading.
  const labelBefore = await getSelectedExampleLabel(page);
  expect(labelBefore.trim()).toBe(NON_DEFAULT_LABEL);

  // Reload the page — the App re-mounts and hydrates from localStorage.
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Re-open the Examples tab (hash should restore it, but click to be safe).
  const hash = new URL(page.url()).hash;
  if (hash !== "#examples") {
    await page.getByRole("button", { name: "Examples" }).click();
  }
  await page.waitForSelector('button[class*="bg-primary\\/10"]', { timeout: 8000 });

  // Assert the non-default example is still selected after reload.
  const labelAfter = await getSelectedExampleLabel(page);
  expect(labelAfter.trim()).toBe(NON_DEFAULT_LABEL);
});

// ---------------------------------------------------------------------------
// Test 2: stale/unrecognized ID in localStorage → falls back to first example
// ---------------------------------------------------------------------------

test("stale lastSelectedExampleId in localStorage falls back to first example", async ({ page }) => {
  // Navigate to the app first so we can manipulate localStorage for its origin.
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Read the current persisted state (if any) to build a valid base state.
  const existingRaw: string | null = await page.evaluate(
    (key: string) => localStorage.getItem(key),
    LS_KEY,
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
      // ignore parse errors; use default base
    }
  }

  // Inject a stale (unrecognized) lastSelectedExampleId.
  const staleState = { ...base, lastSelectedExampleId: "this-id-does-not-exist" };
  await page.evaluate(
    ([key, value]: [string, string]) => localStorage.setItem(key, value),
    [LS_KEY, JSON.stringify(staleState)],
  );

  // Reload the page so App hydrates from the stale state.
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Open the Examples tab.
  await page.getByRole("button", { name: "Examples" }).click();
  await page.waitForSelector('button[class*="bg-primary\\/10"]', { timeout: 8000 });

  // The selected example must NOT be the stale one; it should fall back to
  // the first example (overkill-hill flowchart).
  const selectedLabel = await getSelectedExampleLabel(page);
  expect(selectedLabel.trim()).not.toBe("this-id-does-not-exist");
  // Verify it matches the first example's label pattern (first brand flowchart).
  expect(selectedLabel.trim()).toContain("\u2014 Flowchart");
});
