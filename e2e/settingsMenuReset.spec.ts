import { test, expect } from "@playwright/test";

/**
 * E2E tests for the two-step "Reset all palette customizations" confirmation
 * flow in the Settings menu (Task #436 / Task #349).
 *
 * Behaviors covered:
 *  1. Clicking "Reset all palette customizations" shows the inline confirm UI
 *     ("Reset all?" text, Confirm and Cancel buttons) instead of resetting
 *     immediately.
 *  2. Clicking Confirm executes the reset: menu closes, toast appears.
 *  3. Clicking Cancel dismisses the confirm UI, restores the original button,
 *     and leaves the menu open.
 *
 * Setup: localStorage is cleared before each test so no seeded customizations
 * are needed — the UI flow is exercised regardless of actual palette state.
 */

test.describe("Settings menu — Reset all palette customizations confirmation flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.goto("/");
    await page.waitForLoadState("load");
  });

  // ---------------------------------------------------------------------------
  // Test 1 — clicking the button shows the inline confirm UI (not immediate reset)
  // ---------------------------------------------------------------------------

  test("clicking 'Reset all palette customizations' shows the inline confirm UI", async ({
    page,
  }) => {
    // Open the Settings menu.
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();

    // The original "Reset all palette customizations" menuitem must be visible
    // before clicking.
    const resetBtn = page.getByRole("menuitem", { name: "Reset all palette customizations" });
    await expect(resetBtn).toBeVisible();

    // Click it — should NOT immediately reset; should show confirm UI instead.
    await resetBtn.click();

    // Confirm UI: "Reset all?" text must appear.
    await expect(page.getByText("Reset all?")).toBeVisible({ timeout: 3000 });

    // Both action buttons must be present.
    await expect(page.getByRole("menuitem", { name: "Confirm" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Cancel" })).toBeVisible();

    // The original "Reset all palette customizations" button must be gone
    // (replaced by the confirm UI).
    await expect(resetBtn).not.toBeVisible();

    // Menu must still be open throughout.
    await expect(menu).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 2 — clicking Confirm closes the menu and shows the toast
  // ---------------------------------------------------------------------------

  test("clicking Confirm closes the menu and shows the reset toast", async ({ page }) => {
    // Open menu and enter confirm state.
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.getByRole("menu", { name: "Settings" })).toBeVisible();
    await page.getByRole("menuitem", { name: "Reset all palette customizations" }).click();
    await expect(page.getByText("Reset all?")).toBeVisible();

    // Click Confirm.
    await page.getByRole("menuitem", { name: "Confirm" }).click();

    // Menu must close.
    await expect(page.getByRole("menu", { name: "Settings" })).not.toBeVisible({
      timeout: 3000,
    });

    // Toast must appear with the reset message.
    // The toast is a role="status" element containing the message text.
    await expect(page.getByRole("status")).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("status")).toContainText("All palette customizations reset.");
  });

  // ---------------------------------------------------------------------------
  // Test 3 — reset toast disappears automatically after ~2.5 s
  // ---------------------------------------------------------------------------

  test("reset toast disappears automatically after ~2.5 seconds", async ({ page }) => {
    // Open menu, enter confirm state, click Confirm.
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.getByRole("menu", { name: "Settings" })).toBeVisible();
    await page.getByRole("menuitem", { name: "Reset all palette customizations" }).click();
    await expect(page.getByText("Reset all?")).toBeVisible();
    await page.getByRole("menuitem", { name: "Confirm" }).click();

    // Toast must appear immediately.
    await expect(page.getByRole("status")).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("status")).toContainText("All palette customizations reset.");

    // Wait 3.5 s (buffer above the 2.5 s auto-clear threshold).
    await page.waitForTimeout(3500);

    // Toast must have disappeared on its own — no manual dismiss needed.
    await expect(page.getByRole("status")).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 4 — clicking Cancel restores the original button; menu stays open
  // ---------------------------------------------------------------------------

  test("clicking Cancel dismisses the confirm UI and keeps the menu open", async ({ page }) => {
    // Open menu and enter confirm state.
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();
    await page.getByRole("menuitem", { name: "Reset all palette customizations" }).click();
    await expect(page.getByText("Reset all?")).toBeVisible();

    // Click Cancel.
    await page.getByRole("menuitem", { name: "Cancel" }).click();

    // Confirm UI must be gone.
    await expect(page.getByText("Reset all?")).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("menuitem", { name: "Confirm" })).not.toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Cancel" })).not.toBeVisible();

    // Original "Reset all palette customizations" button must be restored.
    await expect(
      page.getByRole("menuitem", { name: "Reset all palette customizations" })
    ).toBeVisible({ timeout: 3000 });

    // Menu must still be open.
    await expect(menu).toBeVisible();

    // No toast must have appeared (Cancel does not reset anything).
    await expect(page.getByRole("status")).not.toBeVisible();
  });
});
