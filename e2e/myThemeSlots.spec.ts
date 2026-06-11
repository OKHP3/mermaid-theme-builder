/**
 * End-to-end tests for My Theme slot interactions.
 *
 * Covers the four core behaviors of the My Theme workspace feature:
 *   1. Clicking a slot tile marks it aria-checked and deactivates the previous one.
 *   2. The "New" button creates a second slot tile and auto-activates it (max 3).
 *   3. The trash icon → Delete confirmation removes the tile from the palette bar.
 *   4. Color edits while a slot is active write to the slot's colors, not to
 *      customColors for the selected built-in palette.
 *
 * Strategy:
 *   - All tests run on the Compose tab (the default on fresh load). Each tab has
 *     its own tileIdPrefix; the Compose tab uses "compose-palette-tile-*".
 *   - The ApplyTab is always mounted in the DOM (hidden when inactive), so its
 *     palette bar tiles (apply-palette-tile-*) exist but are hidden. We scope
 *     selectors to the compose-palette-tile-* IDs to target the visible bar.
 *   - Tests that need a specific slot configuration seed localStorage before the
 *     first page.goto() call so the app hydrates that state on initial load.
 *   - The trash button is opacity-0 until its parent is hovered. We hover first,
 *     then click with { force: true } to bypass CSS transition timing.
 *
 * The app runs at PLAYWRIGHT_BASE_URL (default: http://localhost:4173/mermaid-theme-builder/).
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LS_KEY = "mtb.state.v1";

/**
 * Compose tab tile ID prefix. Every tab defines its own tileIdPrefix so that
 * slot tile IDs are unique in the DOM even when multiple tabs are mounted.
 * The Compose tab (the app's default tab) uses this prefix.
 */
const PREFIX = "compose-palette-tile";

/** Selector that matches all My Theme slot tiles in the Compose tab's palette bar. */
const SLOT_TILE_SEL = `[role="radio"][id^="${PREFIX}-my-theme-"]`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Seed localStorage with a persisted-state object, then navigate to the app
 * so it hydrates from that state on initial load.
 *
 * Uses page.addInitScript() — the script runs at document creation time,
 * before any page JavaScript executes, so React reads the seeded state on its
 * very first initialization rather than in a later hydration effect.  This
 * avoids the race where tile-1 (from React's default initial state) appears
 * before the hydration effect fires and the extra tiles are added.
 */
async function openWithState(
  page: Page,
  state?: Record<string, unknown>
): Promise<void> {
  await page.addInitScript(
    ({ key, value }: { key: string; value: string | null }) => {
      localStorage.clear();
      sessionStorage.clear();
      if (value) {
        localStorage.setItem(key, value);
      }
    },
    { key: LS_KEY, value: state ? JSON.stringify(state) : null }
  );
  await page.goto("/");
  await page.waitForLoadState("load");
  // Wait for the Compose tab's My Theme 1 tile — the compose tab is the
  // default and "compose-palette-tile-my-theme-1" is unique in the DOM.
  await page.locator(`#${PREFIX}-my-theme-1`).waitFor({ timeout: 8_000 });
}

/**
 * Minimal valid TypographySettings that satisfies the app's hydration guard
 * (each tier must be present as an object with fontSize and fontFamily).
 */
const EMPTY_TYPOGRAPHY = {
  diagramTitle: { fontSize: 20, fontFamily: "" },
  subgraphTitle: { fontSize: 16, fontFamily: "" },
  nestedSubgraphTitle: { fontSize: 14, fontFamily: "" },
  nodeLabel: { fontSize: 14, fontFamily: "" },
  edgeLabel: { fontSize: 12, fontFamily: "" },
};

/**
 * Minimal slot fixture. An empty colors array passes the app's hydration guard
 * (it only checks `Array.isArray(colors)`), so tiles render with gray placeholder
 * swatches — sufficient for aria-checked and interaction tests.
 */
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

/** Base persisted state (caller adds myThemeSlots and activeMyThemeSlotId). */
function baseState(
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
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

// ---------------------------------------------------------------------------
// 1. Clicking a slot tile activates it and deactivates the previous one
// ---------------------------------------------------------------------------

test.describe("My Theme slot — tile selection", () => {
  test("clicking an inactive slot tile sets aria-checked=true on it and false on the previously active one", async ({
    page,
  }) => {
    // Seed two slots with slot 2 active.
    await openWithState(
      page,
      baseState({
        myThemeSlots: [makeSlot(1), makeSlot(2)],
        activeMyThemeSlotId: "my-theme-2",
      })
    );

    const slot1 = page.locator(`#${PREFIX}-my-theme-1`);
    const slot2 = page.locator(`#${PREFIX}-my-theme-2`);

    // addInitScript seeds LS before React initializes, so both tiles are in
    // the DOM from the first render.  Wait briefly for slot-2 as a safety net.
    await slot2.waitFor({ timeout: 8_000 });

    // Confirm starting state: slot 2 active, slot 1 inactive.
    await expect(slot2).toHaveAttribute("aria-checked", "true");
    await expect(slot1).toHaveAttribute("aria-checked", "false");

    // Click slot 1.
    await slot1.click();

    // Slot 1 should now be active and slot 2 inactive.
    await expect(slot1).toHaveAttribute("aria-checked", "true");
    await expect(slot2).toHaveAttribute("aria-checked", "false");
  });
});

// ---------------------------------------------------------------------------
// 2. "New" button creates a second slot and auto-activates it
// ---------------------------------------------------------------------------

test.describe("My Theme slot — add via New button", () => {
  test("clicking New creates a second slot tile and auto-activates it", async ({ page }) => {
    // Fresh load: app starts with one slot (my-theme-1) active by default.
    await openWithState(page);

    const addButton = page.getByRole("button", { name: "Add My Theme workspace", exact: true });
    await expect(addButton).toBeVisible();

    // Only one My Theme tile should exist at this point.
    await expect(page.locator(SLOT_TILE_SEL)).toHaveCount(1);

    await addButton.click();

    // A second slot tile should appear.
    await expect(page.locator(SLOT_TILE_SEL)).toHaveCount(2);

    // The newly added slot (my-theme-2) should be auto-activated.
    const slot2 = page.locator(`#${PREFIX}-my-theme-2`);
    await expect(slot2).toHaveAttribute("aria-checked", "true");

    // The original slot should now be inactive.
    const slot1 = page.locator(`#${PREFIX}-my-theme-1`);
    await expect(slot1).toHaveAttribute("aria-checked", "false");
  });

  test("New button disappears once three slots exist", async ({ page }) => {
    await openWithState(page);

    const addButton = page.getByRole("button", { name: "Add My Theme workspace", exact: true });

    // The app starts with one slot; two more clicks reach the 3-slot limit.
    await addButton.click();
    await addButton.click();

    // At the 3-slot limit the button must no longer be visible.
    await expect(addButton).toBeHidden();

    // All three slot tiles should be present in the Compose bar.
    await expect(page.locator(SLOT_TILE_SEL)).toHaveCount(3);
  });
});

// ---------------------------------------------------------------------------
// 3. Trash icon → Delete confirmation removes the tile
// ---------------------------------------------------------------------------

test.describe("My Theme slot — delete via trash icon", () => {
  test("trash icon → Delete removes the slot tile from the palette bar", async ({ page }) => {
    await openWithState(page);

    // Add a second slot so we can delete the first without emptying the bar.
    const addButton = page.getByRole("button", { name: "Add My Theme workspace", exact: true });
    await addButton.click();
    await expect(page.locator(SLOT_TILE_SEL)).toHaveCount(2);

    // Hover over slot-1 to trigger the CSS that reveals its trash button.
    const slot1 = page.locator(`#${PREFIX}-my-theme-1`);
    await slot1.hover();

    // Click the trash button. force:true bypasses any residual opacity transition.
    const trashBtn = page.getByRole("button", { name: "Delete My Theme 1" });
    await trashBtn.click({ force: true });

    // The confirmation dialog should appear (curly quotes around the name).
    await expect(page.getByText(/Delete .My Theme 1./)).toBeVisible({ timeout: 4_000 });

    // Confirm deletion with the red "Delete" button inside the dialog overlay.
    const dialog = page.locator(".fixed.inset-0");
    await dialog.getByRole("button", { name: "Delete" }).click();

    // Slot-1 tile must be removed from the Compose bar.
    await expect(page.locator(`#${PREFIX}-my-theme-1`)).toHaveCount(0);

    // Only slot-2 should remain.
    await expect(page.locator(SLOT_TILE_SEL)).toHaveCount(1);
    await expect(page.locator(`#${PREFIX}-my-theme-2`)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Color edits while a slot is active route to the slot, not customColors
// ---------------------------------------------------------------------------

test.describe("My Theme slot — color edit routing", () => {
  test("editing a color writes to the active slot's colors, not to customColors", async ({
    page,
  }) => {
    // Fresh load: app starts with my-theme-1 active and pre-seeded with
    // BRAND_PALETTES[0].colors, so hex color inputs are rendered in the editor.
    await openWithState(page);

    // The Compose tab sidebar has color swatches behind a collapsible
    // "Toggle Colors" button (aria-expanded="false" by default). Click it to
    // reveal the swatch section so the hex inputs become visible.
    const toggleColors = page.locator('button[aria-label="Toggle Colors"]:visible').first();
    await toggleColors.click();

    // Wait for the first visible hex color text input.
    const hexInput = page
      .locator('input[aria-label^="Hex value for"]')
      .filter({ visible: true })
      .first();
    await hexInput.waitFor({ timeout: 8_000 });

    const newColor = "#c0ffee";

    // Select all text in the input and replace it with the new hex value.
    await hexInput.click({ clickCount: 3 });
    await hexInput.fill(newColor);
    await hexInput.press("Tab");

    // Allow React's state update to flush and the auto-save localStorage effect
    // to run. The effect is synchronous after each render but we give a small
    // buffer for the browser to commit the write.
    await page.waitForTimeout(300);

    // Read the persisted state from localStorage.
    const raw = await page.evaluate(
      (key: string) => localStorage.getItem(key),
      LS_KEY
    );
    expect(raw, "localStorage must contain persisted state after a color edit").not.toBeNull();

    const state = JSON.parse(raw!) as {
      myThemeSlots?: Array<{ id: string; colors: Array<{ key: string; value: string }> }>;
      customColors?: Record<string, Array<{ key: string; value: string }>>;
    };

    // The new color must appear inside my-theme-1's colors array.
    const slot1 = state.myThemeSlots?.find((s) => s.id === "my-theme-1");
    expect(slot1, "my-theme-1 slot must be present in persisted state").toBeDefined();
    const slotHasColor = slot1!.colors.some((c) => c.value === newColor);
    expect(slotHasColor, "new color must be stored inside the slot's colors array").toBe(true);

    // The built-in palette's customColors entry must NOT contain the new color —
    // confirming the edit was routed to the slot, not the built-in override map.
    const builtinOverrides = state.customColors?.["overkill-hill"] ?? [];
    const leakedToBuiltin = builtinOverrides.some((c) => c.value === newColor);
    expect(
      leakedToBuiltin,
      "new color must NOT leak into customColors for the built-in palette"
    ).toBe(false);
  });
});
