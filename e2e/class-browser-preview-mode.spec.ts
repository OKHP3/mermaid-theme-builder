/**
 * E2E test — ClassBrowser preview-mode localStorage persistence (Task #535).
 *
 * The unit tests verify the save/load round-trip within a single React
 * lifecycle. This spec exercises the full browser path: switch to "All" mode,
 * hard-reload, and confirm the preference is restored.
 *
 * Key facts:
 *   - ClassBrowser lives in the Reference tab, inside the "Class Library"
 *     <details> accordion.
 *   - The All/Used toggle only renders when usedClassNames is non-empty.
 *     extractUsedClasses() matches /:::(\w+)/g, so ":::primary" in inputCode
 *     is enough.
 *   - The app persists inputCode in "mtb.state.v1" and the preview-mode
 *     preference in "mtb.classBrowser.previewMode" (PREVIEW_MODE_KEY).
 *
 * Strategy: seed BOTH keys via addInitScript so there is no race between
 * the app's React useEffect auto-save and page.reload(). The first test
 * clicks "All" (to test the write path), reloads, and reads back.
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PREVIEW_MODE_KEY = "mtb.classBrowser.previewMode";
const STATE_KEY = "mtb.state.v1";

/** Flowchart that references :::primary → usedClassNames is non-empty. */
const DIAGRAM_WITH_USED_CLASS = 'flowchart TD\n  A["Start"]:::primary --> B["End"]';

/** Minimal persisted state that the app accepts on hydration. */
const SEEDED_STATE = JSON.stringify({
  schemaVersion: 1,
  selectedPaletteId: "okh-forge-night",
  customColors: {},
  includeMetaComments: true,
  includeBadge: true,
  customThemeName: "",
  inputCode: DIAGRAM_WITH_USED_CLASS,
  userPalettes: [],
  recentPaletteIds: [],
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Seed both the app state (so inputCode with :::primary is hydrated
 * synchronously) and optionally the preview-mode preference, then navigate
 * to the Reference tab.
 *
 * Uses a sessionStorage sentinel ("__mtb_seeded") so that the init script
 * only clears and re-seeds localStorage on the FIRST load — page.reload()
 * preserves sessionStorage across the reload boundary, preventing the init
 * script from wiping localStorage values set during the test.
 */
async function gotoReferenceWithSeededState(
  page: Page,
  previewMode?: "all" | "used"
): Promise<void> {
  await page.addInitScript(
    ({
      stateKey,
      stateVal,
      modeKey,
      modeVal,
    }: {
      stateKey: string;
      stateVal: string;
      modeKey: string;
      modeVal: string;
    }) => {
      // Only seed on the initial load — sessionStorage persists across
      // page.reload() but is cleared for new contexts, so this fires once.
      if (!sessionStorage.getItem("__mtb_seeded")) {
        sessionStorage.setItem("__mtb_seeded", "1");
        window.localStorage.clear();
      localStorage.setItem("mtb.firstVisit", "true");
        window.localStorage.setItem(stateKey, stateVal);
        if (modeVal) window.localStorage.setItem(modeKey, modeVal);
      }
    },
    {
      stateKey: STATE_KEY,
      stateVal: SEEDED_STATE,
      modeKey: PREVIEW_MODE_KEY,
      modeVal: previewMode ?? "",
    }
  );
  await page.goto("/#reference");
  await page.waitForLoadState("load");
  await page.getByRole("tab", { name: "Reference" }).first().waitFor({ state: "visible" });
}

/** Expand the "Class Library" accordion in the Reference tab. */
async function openClassLibrary(page: Page): Promise<void> {
  const summary = page.getByText("Class Library", { exact: true });
  await summary.waitFor({ state: "visible", timeout: 6_000 });
  const isOpen = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll("details")).find((d) =>
      d.querySelector("summary")?.textContent?.includes("Class Library")
    );
    return el?.open ?? false;
  });
  if (!isOpen) await summary.click();
}

/** Open the classDef preview panel; waits for the All/Used toggle to appear. */
async function openPreviewPanel(page: Page): Promise<void> {
  const previewBtn = page.getByRole("button", { name: "Preview all classDefs" });
  await previewBtn.waitFor({ state: "visible", timeout: 5_000 });
  await previewBtn.click();
  await expect(page.getByRole("group", { name: "Preview mode" })).toBeVisible({
    timeout: 5_000,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("All/Used preference written by clicking 'All' survives a full page reload", async ({
  page,
}) => {
  // 1. Load with seeded state (inputCode contains :::primary, no mode pref yet).
  await gotoReferenceWithSeededState(page);
  await openClassLibrary(page);
  await openPreviewPanel(page);

  // Smart default when hasUsed=true is "used".
  const usedBtn = page.getByRole("button", { name: "Used", exact: true });
  const allBtn = page.getByRole("button", { name: "All", exact: true });
  await expect(usedBtn).toHaveAttribute("aria-pressed", "true");
  await expect(allBtn).toHaveAttribute("aria-pressed", "false");

  // 2. Click "All" — writes "all" to localStorage.
  await allBtn.click();
  await expect(allBtn).toHaveAttribute("aria-pressed", "true");

  // Confirm write before reloading.
  const storedBeforeReload = await page.evaluate(
    (key: string) => window.localStorage.getItem(key),
    PREVIEW_MODE_KEY
  );
  expect(storedBeforeReload).toBe("all");

  // 3. Hard-reload — URL keeps /#reference; seeded state survives in localStorage.
  await page.reload();
  await page.waitForLoadState("load");

  // 4. Reopen Class Library and preview panel.
  await openClassLibrary(page);
  await openPreviewPanel(page);

  // 5. "All" must still be active — restored from localStorage.
  await expect(page.getByRole("button", { name: "All", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("Preference pre-seeded as 'all' is applied when the preview panel first opens", async ({
  page,
}) => {
  // Seed previewMode = "all" — should override the smart default ("used").
  await gotoReferenceWithSeededState(page, "all");
  await openClassLibrary(page);
  await openPreviewPanel(page);

  await expect(page.getByRole("button", { name: "All", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("localStorage holds 'all' after mode switch — confirmed via page.evaluate", async ({
  page,
}) => {
  await gotoReferenceWithSeededState(page);
  await openClassLibrary(page);
  await openPreviewPanel(page);

  await page.getByRole("button", { name: "All", exact: true }).click();

  const stored = await page.evaluate(
    (key: string) => window.localStorage.getItem(key),
    PREVIEW_MODE_KEY
  );
  expect(stored).toBe("all");
});
