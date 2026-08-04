import { test, expect } from "@playwright/test";

/**
 * E2E tests for the visible outcomes of Settings menu actions (Task #437).
 *
 * These tests confirm that the browser actually renders the expected toast and
 * closes (or keeps open) the menu after each action — unit tests for the same
 * actions (Task #350) only verify internal React state, not real CSS visibility
 * or toast rendering.
 *
 * Covered actions:
 *  1. "Reset all syntax tips"          → toast "Syntax tips restored.", menu closes
 *  2. "Reset all palette customizations" → confirm panel becomes visible
 *     2a. Confirm → toast "All palette customizations reset.", menu closes
 *     2b. Cancel  → original button restored, menu stays open (no toast)
 *  3. "Clear recent palette history"   → toast "Recent palette history cleared.", menu closes
 *
 * Note: The two-step confirm/cancel flow for action 2 is also covered in detail
 * by e2e/settingsMenuReset.spec.ts (Task #436). The tests here provide a
 * complementary smoke-level check within the full-actions context.
 */

test.describe("Settings menu — action outcomes", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.goto("/");
    await page.waitForLoadState("load");
  });

  // ---------------------------------------------------------------------------
  // Helper: open the Settings menu
  // ---------------------------------------------------------------------------

  async function openMenu(page: import("@playwright/test").Page) {
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.getByRole("menu", { name: "Settings" })).toBeVisible();
  }

  // ---------------------------------------------------------------------------
  // 1. Reset all syntax tips — toast appears, menu closes
  // ---------------------------------------------------------------------------

  test('"Reset all syntax tips" closes the menu and shows the restored toast', async ({ page }) => {
    await openMenu(page);

    await page.getByRole("menuitem", { name: "Reset all syntax tips" }).click();

    // Menu must close.
    await expect(page.getByRole("menu", { name: "Settings" })).not.toBeVisible({
      timeout: 3000,
    });

    // Toast with the correct message must be visible.
    await expect(page.getByRole("status")).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("status")).toContainText("Syntax tips restored.");
  });

  // ---------------------------------------------------------------------------
  // 2a. Reset all palette customizations → Confirm — toast appears, menu closes
  // ---------------------------------------------------------------------------

  test('"Reset all palette customizations" → Confirm → toast appears and menu closes', async ({
    page,
  }) => {
    await openMenu(page);

    // Click the reset button — should show the confirm panel, not reset immediately.
    await page.getByRole("menuitem", { name: "Reset all palette customizations" }).click();
    await expect(page.getByText("Reset all?")).toBeVisible({ timeout: 3000 });

    // Confirm the reset.
    await page.getByRole("menuitem", { name: "Confirm" }).click();

    // Menu must close.
    await expect(page.getByRole("menu", { name: "Settings" })).not.toBeVisible({
      timeout: 3000,
    });

    // Toast must appear.
    await expect(page.getByRole("status")).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("status")).toContainText("All palette customizations reset.");
  });

  // ---------------------------------------------------------------------------
  // 2b. Reset all palette customizations → Cancel — no toast, menu stays open
  // ---------------------------------------------------------------------------

  test('"Reset all palette customizations" → Cancel → no toast, menu stays open', async ({
    page,
  }) => {
    await openMenu(page);

    await page.getByRole("menuitem", { name: "Reset all palette customizations" }).click();
    await expect(page.getByText("Reset all?")).toBeVisible({ timeout: 3000 });

    await page.getByRole("menuitem", { name: "Cancel" }).click();

    // Confirm UI gone, original button restored.
    await expect(page.getByText("Reset all?")).not.toBeVisible({ timeout: 3000 });
    await expect(
      page.getByRole("menuitem", { name: "Reset all palette customizations" })
    ).toBeVisible({ timeout: 3000 });

    // Menu still open.
    await expect(page.getByRole("menu", { name: "Settings" })).toBeVisible();

    // No toast.
    await expect(page.getByRole("status")).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 3. Clear recent palette history — toast appears, menu closes
  // ---------------------------------------------------------------------------

  test('"Clear recent palette history" closes the menu and shows the cleared toast', async ({
    page,
  }) => {
    await openMenu(page);

    await page.getByRole("menuitem", { name: "Clear recent palette history" }).click();

    // Menu must close.
    await expect(page.getByRole("menu", { name: "Settings" })).not.toBeVisible({
      timeout: 3000,
    });

    // Toast with the correct message must be visible.
    await expect(page.getByRole("status")).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("status")).toContainText("Recent palette history cleared.");
  });

  // ---------------------------------------------------------------------------
  // 4. Reset all syntax tips — dismissed hint reappears in the Apply tab
  // ---------------------------------------------------------------------------

  test('"Reset all syntax tips" makes a dismissed FamilySyntaxHint reappear in the Apply tab', async ({
    page,
  }) => {
    // 1. Navigate to the Apply tab and paste a flowchart so the hint bar appears.
    await page.getByRole("tab", { name: "Apply" }).first().click();
    await page.getByLabel("Mermaid diagram code input").waitFor({ state: "visible" });
    await page.getByLabel("Mermaid diagram code input").fill("flowchart TD\n  A[Start] --> B[End]");

    // 2. The FamilySyntaxHint bar for "flowchart" must be visible.
    const hintBar = page.getByRole("note", { name: "Syntax tips for flowchart" });
    await expect(hintBar).toBeVisible({ timeout: 5000 });

    // 3. Dismiss the hint using its close button.
    await page.getByRole("button", { name: "Dismiss flowchart syntax tip" }).click();

    // 4. Hint bar must be gone after dismissal.
    await expect(hintBar).not.toBeVisible({ timeout: 3000 });

    // 5. Click "Reset all syntax tips" in the Settings menu.
    await openMenu(page);
    await page.getByRole("menuitem", { name: "Reset all syntax tips" }).click();

    // Menu closes and toast appears (existing coverage).
    await expect(page.getByRole("menu", { name: "Settings" })).not.toBeVisible({
      timeout: 3000,
    });
    await expect(page.getByRole("status")).toContainText("Syntax tips restored.");

    // 6. The hint bar must reappear — React re-reads dismissal state via
    //    the hintResetToken that is incremented alongside clearAllDismissals().
    await expect(hintBar).toBeVisible({ timeout: 5000 });
  });
});
