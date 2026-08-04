/**
 * End-to-end tests for "Import as new slot" — the Import button in
 * PaletteSelectorBar that uploads a palette JSON and creates a new My Theme
 * workspace slot.
 *
 * Covers three behaviors:
 *   1. Happy path: import a clean JSON → new slot created, auto-selected,
 *      toast confirms name and "into a new My Theme slot".
 *   2. Disabled state: when all 3 slots are full the Import button is replaced
 *      by a disabled indicator (a span with title
 *      "All 3 slots are in use — delete one to import").
 *   3. Warning path: import a JSON whose colors use CSS values → toast includes
 *      "CSS values may not render in Mermaid".
 *
 * Strategy:
 *   - Navigate to the Apply tab after load.  While Apply is active ComposeTab
 *     is not mounted (conditional rendering), so exactly one PaletteSelectorBar
 *     is live in the DOM — no selector ambiguity between tabs.
 *   - Seed localStorage via page.addInitScript() before React initialises to
 *     avoid races with the default first render.
 *   - Trigger the import by calling setInputFiles on the hidden file input
 *     (`input[aria-label="Import palette JSON as new slot"]`) rather than
 *     clicking through the OS file dialog.
 *
 * The app runs at PLAYWRIGHT_BASE_URL
 * (default: http://localhost:4173/mermaid-theme-builder/).
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LS_KEY = "mtb.state.v1";
const APPLY_PREFIX = "apply-palette-tile";
const APPLY_SLOT_SEL = `[role="radio"][id^="${APPLY_PREFIX}-my-theme-"]`;

// ---------------------------------------------------------------------------
// Fixture palette JSONs
// ---------------------------------------------------------------------------

/** Minimal valid palette — all clean hex values. */
const CLEAN_PALETTE_JSON = JSON.stringify({
  type: "mtb-palette",
  schemaVersion: 1,
  id: "import-as-new-test",
  name: "Slate Storm",
  description: "test",
  version: "1.0.0",
  colors: [{ key: "primaryColor", label: "Primary", value: "#334155" }],
});

/** Palette with a named CSS color — routes to warnValues, triggers warning toast. */
const WARN_PALETTE_JSON = JSON.stringify({
  type: "mtb-palette",
  schemaVersion: 1,
  id: "import-warn-test",
  name: "Coral Warning",
  description: "test",
  version: "1.0.0",
  colors: [{ key: "primaryColor", label: "Primary", value: "coral" }],
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal valid TypographySettings that satisfies the app's hydration guard.
 */
const EMPTY_TYPOGRAPHY = {
  diagramTitle: { fontSize: 20, fontFamily: "" },
  subgraphTitle: { fontSize: 16, fontFamily: "" },
  nestedSubgraphTitle: { fontSize: 14, fontFamily: "" },
  nodeLabel: { fontSize: 14, fontFamily: "" },
  edgeLabel: { fontSize: 12, fontFamily: "" },
};

/** Minimal slot fixture — empty colors passes the hydration guard. */
function makeSlot(n: 1 | 2 | 3) {
  return {
    id: `my-theme-${n}`,
    name: `My Theme ${n}`,
    colors: [],
    look: "classic",
    fontSize: "",
    typography: EMPTY_TYPOGRAPHY,
  };
}

/** Base persisted state — caller adds myThemeSlots / activeMyThemeSlotId. */
function baseState(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    selectedPaletteId: "overkill-hill",
    customColors: {},
    includeMetaComments: true,
    includeBadge: true,
    customThemeName: "",
    inputCode: "flowchart TD\n  A --> B",
    userPalettes: [],
    recentPaletteIds: [],
    ...extra,
  };
}

/**
 * Seed localStorage, navigate to the app, then switch to the Apply tab.
 *
 * While the Apply tab is active, ComposeTab is not mounted (App.tsx uses
 * conditional rendering for that panel), so there is exactly one
 * PaletteSelectorBar in the live DOM.
 */
async function openOnApplyTab(page: Page, state?: Record<string, unknown>): Promise<void> {
  await page.addInitScript(
    ({ key, value }: { key: string; value: string | null }) => {
      localStorage.clear();
      sessionStorage.clear();
      if (value) localStorage.setItem(key, value);
    },
    { key: LS_KEY, value: state ? JSON.stringify(state) : null }
  );
  await page.goto("/");
  await page.waitForLoadState("load");

  // Navigate to Apply tab so ComposeTab is unmounted and there is exactly
  // one PaletteSelectorBar (with its Import button) in the live DOM.
  await page.getByRole("tab", { name: "Apply", exact: true }).click();

  // Wait for the Apply tab's slot-1 tile to confirm the bar is rendered.
  await page.locator(`#${APPLY_PREFIX}-my-theme-1`).waitFor({ timeout: 8_000 });
}

/**
 * Trigger an import by feeding `json` directly to the hidden file input in
 * PaletteSelectorBar without opening the OS file dialog.
 */
async function importViaFileInput(page: Page, json: string): Promise<void> {
  const fileInput = page.locator('input[aria-label="Import palette JSON as new slot"]');
  await fileInput.setInputFiles({
    name: "palette.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });
}

// ---------------------------------------------------------------------------
// 1. Happy path — clean JSON creates a new slot and auto-selects it
// ---------------------------------------------------------------------------

test.describe("Import as new slot — happy path", () => {
  test("importing a clean JSON creates a second slot tile", async ({ page }) => {
    // Fresh load: one slot (my-theme-1) active by default.
    await openOnApplyTab(page);

    // Only one My Theme tile exists at this point.
    await expect(page.locator(APPLY_SLOT_SEL)).toHaveCount(1);

    await importViaFileInput(page, CLEAN_PALETTE_JSON);

    // A second slot tile must appear.
    await expect(page.locator(APPLY_SLOT_SEL)).toHaveCount(2, { timeout: 4_000 });
  });

  test("the new slot tile is auto-selected (aria-checked=true)", async ({ page }) => {
    await openOnApplyTab(page);

    await importViaFileInput(page, CLEAN_PALETTE_JSON);

    // my-theme-2 is the newly created slot — it should be auto-activated.
    const newTile = page.locator(`#${APPLY_PREFIX}-my-theme-2`);
    await expect(newTile).toHaveAttribute("aria-checked", "true", { timeout: 4_000 });

    // The original slot should now be inactive.
    const slot1 = page.locator(`#${APPLY_PREFIX}-my-theme-1`);
    await expect(slot1).toHaveAttribute("aria-checked", "false");
  });

  test("success toast mentions the palette name and 'new My Theme slot'", async ({ page }) => {
    await openOnApplyTab(page);

    await importViaFileInput(page, CLEAN_PALETTE_JSON);

    const toast = page.locator('[role="status"]');
    await expect(toast).toBeVisible({ timeout: 4_000 });
    await expect(toast).toContainText("Slate Storm");
    await expect(toast).toContainText("new My Theme slot");
  });
});

// ---------------------------------------------------------------------------
// 2. Disabled state — Import button hidden when all 3 slots are full
// ---------------------------------------------------------------------------

test.describe("Import as new slot — disabled at 3 slots", () => {
  test("Import button is absent when 3 slots already exist", async ({ page }) => {
    await openOnApplyTab(
      page,
      baseState({
        myThemeSlots: [makeSlot(1), makeSlot(2), makeSlot(3)],
        activeMyThemeSlotId: "my-theme-1",
      })
    );

    // Wait for all 3 tiles to confirm the bar is fully hydrated.
    await page.locator(`#${APPLY_PREFIX}-my-theme-3`).waitFor({ timeout: 8_000 });

    // The Import button must not exist in the DOM when slots are full.
    await expect(page.getByRole("button", { name: "Import JSON as new slot" })).toBeHidden();
  });

  test("disabled indicator appears with correct title when 3 slots exist", async ({ page }) => {
    await openOnApplyTab(
      page,
      baseState({
        myThemeSlots: [makeSlot(1), makeSlot(2), makeSlot(3)],
        activeMyThemeSlotId: "my-theme-1",
      })
    );

    await page.locator(`#${APPLY_PREFIX}-my-theme-3`).waitFor({ timeout: 8_000 });

    // The disabled indicator span must be visible with the explanatory title.
    await expect(page.getByTitle("All 3 slots are in use — delete one to import")).toBeVisible({
      timeout: 4_000,
    });
  });

  test("Import button visible again after a slot is deleted", async ({ page }) => {
    await openOnApplyTab(
      page,
      baseState({
        myThemeSlots: [makeSlot(1), makeSlot(2), makeSlot(3)],
        activeMyThemeSlotId: "my-theme-1",
      })
    );

    await page.locator(`#${APPLY_PREFIX}-my-theme-3`).waitFor({ timeout: 8_000 });

    // Confirm Import button is absent at 3 slots.
    await expect(page.getByRole("button", { name: "Import JSON as new slot" })).toBeHidden();

    // Delete slot-3 via its trash button.
    const slot3 = page.locator(`#${APPLY_PREFIX}-my-theme-3`);
    await slot3.hover();
    await page.getByRole("button", { name: "Delete My Theme 3" }).click({ force: true });

    // Confirm the deletion dialog and click Delete.
    await expect(page.getByText(/Delete .My Theme 3./)).toBeVisible({ timeout: 4_000 });
    const dialog = page.locator(".fixed.inset-0");
    await dialog.getByRole("button", { name: "Delete" }).click();

    // Now only 2 slots remain — Import button must reappear.
    await expect(page.getByRole("button", { name: "Import JSON as new slot" })).toBeVisible({
      timeout: 4_000,
    });
  });
});

// ---------------------------------------------------------------------------
// 2b. Disabled state via New button — Import hidden after clicking New twice
// ---------------------------------------------------------------------------
//
// This describe block exercises the React-state path rather than hydration:
// it starts from the default single-slot state and reaches the 3-slot limit by
// clicking "Add My Theme workspace" twice.  The Import-button visibility
// condition (`myThemeSlots.length < 3`) could diverge from the seeded-state
// path if it were ever guarded by a separate piece of state, so we test both.

test.describe("Import as new slot — disabled after clicking New twice", () => {
  test("Import button is hidden once 3 slots exist via the New button", async ({ page }) => {
    // Fresh load — no seeded state, 1 slot by default.
    await openOnApplyTab(page);
    await expect(page.locator(APPLY_SLOT_SEL)).toHaveCount(1);

    // Click New to add slot 2.
    await page.getByRole("button", { name: "Add My Theme workspace", exact: true }).click();
    await page.locator(`#${APPLY_PREFIX}-my-theme-2`).waitFor({ timeout: 8_000 });

    // Click New again to add slot 3.
    await page.getByRole("button", { name: "Add My Theme workspace", exact: true }).click();
    await page.locator(`#${APPLY_PREFIX}-my-theme-3`).waitFor({ timeout: 8_000 });

    // At 3 slots the Import button must not be present.
    await expect(page.getByRole("button", { name: "Import JSON as new slot" })).toBeHidden();
  });

  test("disabled indicator appears with correct title after clicking New twice", async ({
    page,
  }) => {
    await openOnApplyTab(page);

    await page.getByRole("button", { name: "Add My Theme workspace", exact: true }).click();
    await page.locator(`#${APPLY_PREFIX}-my-theme-2`).waitFor({ timeout: 8_000 });

    await page.getByRole("button", { name: "Add My Theme workspace", exact: true }).click();
    await page.locator(`#${APPLY_PREFIX}-my-theme-3`).waitFor({ timeout: 8_000 });

    // The disabled indicator must be visible with the correct explanatory title.
    await expect(page.getByTitle("All 3 slots are in use — delete one to import")).toBeVisible({
      timeout: 4_000,
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Full-slots guard — toast appears when all 3 slots are occupied
// ---------------------------------------------------------------------------
//
// The Import button is replaced by a disabled span when slots are full, but
// the hidden <input> that processes the file is always present in the DOM.
// If the user somehow triggers it (e.g. two tabs with different slot counts),
// handleImportAsNewSlot should show a toast rather than silently ignoring the
// file.

test.describe("Import as new slot — full-slots guard toast", () => {
  test("shows 'All 3 slots are in use' toast when import is attempted at capacity", async ({
    page,
  }) => {
    // Seed 3 slots so the app loads at capacity.
    await openOnApplyTab(
      page,
      baseState({
        myThemeSlots: [makeSlot(1), makeSlot(2), makeSlot(3)],
        activeMyThemeSlotId: "my-theme-1",
      })
    );

    await page.locator(`#${APPLY_PREFIX}-my-theme-3`).waitFor({ timeout: 8_000 });

    // Trigger the hidden file input directly — the Import button is hidden but
    // the <input> element is always present in the DOM.
    await importViaFileInput(page, CLEAN_PALETTE_JSON);

    // A toast with the capacity message must appear.
    const toast = page.locator('[role="status"]');
    await expect(toast).toBeVisible({ timeout: 4_000 });
    await expect(toast).toContainText("All 3 My Theme slots are in use");
  });

  test("slot count stays at 3 — no new slot is created when guard fires", async ({ page }) => {
    await openOnApplyTab(
      page,
      baseState({
        myThemeSlots: [makeSlot(1), makeSlot(2), makeSlot(3)],
        activeMyThemeSlotId: "my-theme-1",
      })
    );

    await page.locator(`#${APPLY_PREFIX}-my-theme-3`).waitFor({ timeout: 8_000 });

    await importViaFileInput(page, CLEAN_PALETTE_JSON);

    // Toast must appear first so we know the handler ran.
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 4_000 });

    // Slot count must remain at 3.
    await expect(page.locator(APPLY_SLOT_SEL)).toHaveCount(3);
  });
});

// ---------------------------------------------------------------------------
// 4. Warning path — CSS color values produce a warning toast
// ---------------------------------------------------------------------------

test.describe("Import as new slot — CSS value warning toast", () => {
  test("toast mentions CSS values when palette has a named CSS color", async ({ page }) => {
    await openOnApplyTab(page);

    await importViaFileInput(page, WARN_PALETTE_JSON);

    const toast = page.locator('[role="status"]');
    await expect(toast).toBeVisible({ timeout: 4_000 });
    await expect(toast).toContainText("Coral Warning");
    await expect(toast).toContainText("CSS values may not render in Mermaid");
  });

  test("a new slot tile is still created even when the toast carries a warning", async ({
    page,
  }) => {
    await openOnApplyTab(page);

    // Only 1 slot before import.
    await expect(page.locator(APPLY_SLOT_SEL)).toHaveCount(1);

    await importViaFileInput(page, WARN_PALETTE_JSON);

    // The slot must still be created despite the warning.
    await expect(page.locator(APPLY_SLOT_SEL)).toHaveCount(2, { timeout: 4_000 });
    const newTile = page.locator(`#${APPLY_PREFIX}-my-theme-2`);
    await expect(newTile).toHaveAttribute("aria-checked", "true", { timeout: 4_000 });
  });
});
