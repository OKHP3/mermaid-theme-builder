/**
 * End-to-end tests for the import warning amber banner (Task #309).
 *
 * Covers two warning categories that land in warnValues (not invalidValues):
 *   A. Named CSS color ("red") — Task #238 added the category; this test
 *      confirms the amber banner actually appears in the running app.
 *   B. CSS color function ("rgb(255,0,0)") — Task #308 added this category;
 *      a second describe block protects the new wording end-to-end.
 *
 * Strategy: call `setInputFiles` directly on the hidden file input
 * (`<input aria-label="Import palette JSON file">`).  This triggers the same
 * `onChange` handler as a real file-picker dialog, without needing OS-level
 * dialog interaction.  The "My Palettes" section must be expanded first so
 * the amber banner (which lives inside it) is visible after the import.
 *
 * The app runs at PLAYWRIGHT_BASE_URL (default: http://localhost:4173/mermaid-theme-builder/).
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Fixture palette JSONs
// ---------------------------------------------------------------------------

/** Single named CSS color in primaryColor — routes to warnValues. */
const NAMED_COLOR_JSON = JSON.stringify({
  type: "mtb-palette",
  schemaVersion: 1,
  id: "test-named-warn",
  name: "Named Color Test",
  description: "test",
  version: "1.0.0",
  colors: [{ key: "primaryColor", label: "Primary", value: "red" }],
});

/** Single CSS function color in lineColor — routes to warnValues (Task #308). */
const FUNC_COLOR_JSON = JSON.stringify({
  type: "mtb-palette",
  schemaVersion: 1,
  id: "test-func-warn",
  name: "Function Color Test",
  description: "test",
  version: "1.0.0",
  colors: [{ key: "lineColor", label: "Line", value: "rgb(255,0,0)" }],
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Navigate to the app, switch to Compose, expand "My Palettes", then set the
 * given JSON as the imported palette file — triggering the import handler
 * without opening the OS file picker.
 */
async function openComposeAndImport(page: Page, json: string): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("load");

  // Switch to the Compose tab.
  await page.getByRole("tab", { name: "Compose" }).first().click();

  // The banner lives inside the "My Palettes" collapsible section which
  // starts closed.  Expand it so the banner will be visible after import.
  const toggle = page.getByRole("button", { name: "Toggle My Themes" });
  await toggle.waitFor({ timeout: 8_000 });
  await toggle.click();

  // Wait for the Import JSON button to confirm the section is open.
  await page.getByRole("button", { name: "Import JSON" }).waitFor({ timeout: 4_000 });

  // Feed the JSON directly to the hidden file input — same code path as a
  // real import but without the OS file dialog.
  const fileInput = page.locator('input[aria-label="Import palette JSON file"]');
  await fileInput.setInputFiles({
    name: "test-palette.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });
}

// ---------------------------------------------------------------------------
// A — named CSS color ("red")
// ---------------------------------------------------------------------------

test.describe("Import warning banner — named CSS color", () => {
  test("banner heading 'Palette import warnings' appears", async ({ page }) => {
    await openComposeAndImport(page, NAMED_COLOR_JSON);
    await expect(page.getByText("Palette import warnings")).toBeVisible({ timeout: 4_000 });
  });

  test("'Named CSS color' warning paragraph appears in the banner", async ({ page }) => {
    await openComposeAndImport(page, NAMED_COLOR_JSON);
    await expect(page.getByText(/Named CSS color/)).toBeVisible({ timeout: 4_000 });
  });

  test("affected key ('primaryColor') and value ('red') appear in the banner", async ({ page }) => {
    await openComposeAndImport(page, NAMED_COLOR_JSON);
    // Both key and value must be in the same <li> entry inside the banner.
    const entry = page
      .locator("li")
      .filter({ hasText: "primaryColor" })
      .filter({ hasText: '"red"' });
    await expect(entry).toBeVisible({ timeout: 4_000 });
  });

  test("banner does NOT show 'Invalid color values' section for a named-color import", async ({
    page,
  }) => {
    await openComposeAndImport(page, NAMED_COLOR_JSON);
    // "Invalid color values" prose only appears for hard invalidValues entries.
    await expect(page.getByText(/Invalid color values/)).toBeHidden();
  });
});

// ---------------------------------------------------------------------------
// B — CSS color function ("rgb(255,0,0)")  [Task #308]
// ---------------------------------------------------------------------------

test.describe("Import warning banner — CSS color function", () => {
  test("banner heading 'Palette import warnings' appears", async ({ page }) => {
    await openComposeAndImport(page, FUNC_COLOR_JSON);
    await expect(page.getByText("Palette import warnings")).toBeVisible({ timeout: 4_000 });
  });

  test("'CSS color function' warning paragraph appears in the banner", async ({ page }) => {
    await openComposeAndImport(page, FUNC_COLOR_JSON);
    await expect(page.getByText(/CSS color function/)).toBeVisible({ timeout: 4_000 });
  });

  test("affected key ('lineColor') and value ('rgb(255,0,0)') appear in the banner", async ({
    page,
  }) => {
    await openComposeAndImport(page, FUNC_COLOR_JSON);
    const entry = page
      .locator("li")
      .filter({ hasText: "lineColor" })
      .filter({ hasText: '"rgb(255,0,0)"' });
    await expect(entry).toBeVisible({ timeout: 4_000 });
  });

  test("banner does NOT show 'Invalid color values' section for a function-color import", async ({
    page,
  }) => {
    await openComposeAndImport(page, FUNC_COLOR_JSON);
    await expect(page.getByText(/Invalid color values/)).toBeHidden();
  });
});
