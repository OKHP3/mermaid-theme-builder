/**
 * End-to-end tests for the PromptScaffoldModal copy flash (Task #189).
 *
 * Covers the emerald-tint feedback on the preview toggle bar that fires
 * when the user copies a prompt scaffold format (task #117).
 *
 * Two copy paths are exercised:
 *   A. Main card copy button (visible without opening the preview panel)
 *   B. In-preview copy button (inside the expanded preview panel)
 *
 * Each path asserts:
 *   1. The toggle bar for the copied format gains emerald CSS classes.
 *   2. The modal closes automatically once the flash completes (~1350 ms total).
 *      Closure proves the flash reverted (copiedFormat reset → modal unmounted).
 *
 * The app runs at BASE_URL (default: http://localhost:80/mermaid-theme-builder/).
 * Set PLAYWRIGHT_BASE_URL to override.
 */

import { test, expect, type Page, type BrowserContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants — must match PromptScaffoldModal.tsx
// ---------------------------------------------------------------------------

/**
 * Total auto-close time: 1200 ms flash + 150 ms close animation = 1350 ms.
 * We give a generous 5 s window in case CI is slow.
 */
const MODAL_AUTO_CLOSE_MS = 5_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Grant clipboard write permission so navigator.clipboard.writeText succeeds. */
async function grantClipboard(context: BrowserContext): Promise<void> {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
}

/**
 * Navigate to the app, switch to the Compose tab, expand the Bootstrap Export
 * section (collapsed by default), and click "Generate Prompt Pattern" to open the
 * modal.
 */
async function openScaffoldModal(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto("/");
  await page.waitForLoadState("load");

  // Navigate to the Compose tab (role="tab" per ARIA widget pattern).
  await page.getByRole("tab", { name: "Compose", exact: true }).click();

  // The "Generate Prompt Pattern" button lives inside the Export Theme section.
  const toggleBtn = page.getByRole("button", { name: "Export Theme", exact: true });
  await toggleBtn.waitFor({ timeout: 8_000 });
  await toggleBtn.click();

  // Wait for the trigger button to be visible before clicking it.
  const trigger = page.getByRole("button", { name: "Generate Prompt Pattern", exact: true });
  await trigger.waitFor({ timeout: 4_000 });
  await trigger.click();

  // Modal must appear.
  await page.waitForSelector('[role="dialog"]', { timeout: 8_000 });
}

/**
 * Returns the preview toggle-bar button for a format identified by its badge label.
 * The aria-label is "Preview <badge> scaffold" when the panel is closed.
 */
function previewToggleBar(page: Page, badge: string) {
  return page.getByRole("button", { name: `Preview ${badge} scaffold` });
}

/**
 * Returns the in-preview copy button for a format.
 * The aria-label is "Copy <badge> scaffold" (set in PromptScaffoldModal.tsx line ~388).
 */
function inPreviewCopyBtn(page: Page, badge: string) {
  return page.getByRole("button", { name: `Copy ${badge} scaffold` });
}

// ---------------------------------------------------------------------------
// Path A — main card copy button
// ---------------------------------------------------------------------------

test.describe("PromptScaffoldModal — Path A: main card copy button", () => {
  test("toggle bar for the copied format gains emerald classes", async ({ page, context }) => {
    await grantClipboard(context);
    await openScaffoldModal(page);

    // Locate the Format A toggle bar before the copy.  It must NOT be emerald yet.
    const bar = previewToggleBar(page, "Format A");
    await expect(bar).toBeVisible();
    await expect(bar).not.toHaveClass(/bg-emerald-500/);

    // Click the Format A main copy button.  It contains the badge text "Format A"
    // and sits inside the dialog.  The toggle-bar button only contains "Preview"
    // so filtering by "Format A" uniquely targets the copy button.
    await page
      .locator('[role="dialog"]')
      .getByRole("button")
      .filter({ hasText: "Format A" })
      .first()
      .click();

    // Toggle bar must flash emerald immediately after the copy.
    await expect(bar).toHaveClass(/bg-emerald-500/, { timeout: 3_000 });
  });

  test("flash reverts — modal closes automatically after the emerald period", async ({
    page,
    context,
  }) => {
    await grantClipboard(context);
    await openScaffoldModal(page);

    // Click the Format B main copy button.
    await page
      .locator('[role="dialog"]')
      .getByRole("button")
      .filter({ hasText: "Format B" })
      .first()
      .click();

    // The modal must auto-close (flash reset + close animation ~ 1350 ms).
    await expect(page.locator('[role="dialog"]')).toBeHidden({
      timeout: MODAL_AUTO_CLOSE_MS,
    });
  });

  test("only one toggle bar goes emerald — the other formats are dimmed", async ({
    page,
    context,
  }) => {
    await grantClipboard(context);
    await openScaffoldModal(page);

    // Click Format A copy button.
    await page
      .locator('[role="dialog"]')
      .getByRole("button")
      .filter({ hasText: "Format A" })
      .first()
      .click();

    // Only the Format A toggle bar should go emerald.  We scope to toggle-bar
    // buttons via aria-label^="Preview" (the label used when not previewing), so
    // neither the main card copy button nor the in-preview copy button match.
    await expect(
      page.locator('[role="dialog"] button[aria-label^="Preview"][class*="bg-emerald-500"]')
    ).toHaveCount(1, { timeout: 3_000 });
  });
});

// ---------------------------------------------------------------------------
// Path B — in-preview copy button (inside the expanded preview panel)
// ---------------------------------------------------------------------------

test.describe("PromptScaffoldModal — Path B: in-preview copy button", () => {
  test("expanding the preview panel shows the in-preview copy button", async ({
    page,
    context,
  }) => {
    await grantClipboard(context);
    await openScaffoldModal(page);

    // Open the Format A preview panel via the toggle bar.
    await previewToggleBar(page, "Format A").click();

    // The in-preview copy button must now be visible.
    await expect(inPreviewCopyBtn(page, "Format A")).toBeVisible({
      timeout: 4_000,
    });
  });

  test("in-preview copy button — toggle bar gains emerald classes after click", async ({
    page,
    context,
  }) => {
    await grantClipboard(context);
    await openScaffoldModal(page);

    // Expand the Format A preview panel.
    const bar = previewToggleBar(page, "Format A");
    await bar.click();

    // Confirm the in-preview copy button is ready.
    const copyBtn = inPreviewCopyBtn(page, "Format A");
    await expect(copyBtn).toBeVisible({ timeout: 4_000 });

    // Click it.
    await copyBtn.click();

    // After copy, the Format A toggle bar has bg-emerald-500/10 and its
    // aria-label switches to "Hide preview for Format A" (preview is still
    // open).  Scope to that specific button to avoid matching the main card
    // copy button or the in-preview copy button which also gain emerald class.
    await expect(
      page.locator('[role="dialog"] button[aria-label="Hide preview for Format A"]')
    ).toHaveClass(/bg-emerald-500/, { timeout: 3_000 });
  });

  test("in-preview copy button — modal closes automatically after the flash", async ({
    page,
    context,
  }) => {
    await grantClipboard(context);
    await openScaffoldModal(page);

    // Expand Format B preview panel.
    await previewToggleBar(page, "Format B").click();

    // Click the in-preview copy button.
    await inPreviewCopyBtn(page, "Format B").click();

    // Modal must disappear within the auto-close window.
    await expect(page.locator('[role="dialog"]')).toBeHidden({
      timeout: MODAL_AUTO_CLOSE_MS,
    });
  });

  test("in-preview copy button itself shows emerald styling while flash is active", async ({
    page,
    context,
  }) => {
    await grantClipboard(context);
    await openScaffoldModal(page);

    // Open Format A preview.
    await previewToggleBar(page, "Format A").click();
    const copyBtn = inPreviewCopyBtn(page, "Format A");
    await expect(copyBtn).toBeVisible({ timeout: 4_000 });

    // Click to copy.
    await copyBtn.click();

    // The button itself changes aria-label to "Copied Format A scaffold" while flashing.
    await expect(page.getByRole("button", { name: "Copied Format A scaffold" })).toBeVisible({
      timeout: 3_000,
    });
  });
});
