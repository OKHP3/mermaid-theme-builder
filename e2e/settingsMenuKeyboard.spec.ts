import { test, expect } from "@playwright/test";

/**
 * Settings menu keyboard-navigation guard.
 *
 * Verifies three behaviors that keyboard-only users depend on:
 *
 *  1. Pressing Enter on the settings button opens the role=menu.
 *  2. Pressing ArrowDown (from the open menu or from the trigger) moves
 *     focus to the first role=menuitem.
 *  3. Pressing Escape closes the menu and returns focus to the trigger button.
 *
 * A regression in any of these paths would leave keyboard-only users unable
 * to reach settings (e.g. reset syntax tips or clear palette history).
 */

test.describe("Settings menu keyboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Enter on the settings button opens the menu (role=menu is visible)", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings" });
    await settingsBtn.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();
  });

  test("Space on the settings button opens the menu (role=menu is visible)", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings" });
    await settingsBtn.focus();
    await page.keyboard.press("Space");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();
  });

  test("ArrowDown moves focus to the first role=menuitem after opening", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings" });
    await settingsBtn.focus();

    // Open the menu with Enter first, then press ArrowDown
    await page.keyboard.press("Enter");
    await page.getByRole("menu", { name: "Settings" }).waitFor({ state: "visible" });
    await page.keyboard.press("ArrowDown");

    const focusedRole = await page.evaluate(
      () => document.activeElement?.getAttribute("role") ?? null
    );
    expect(focusedRole).toBe("menuitem");

    // Confirm it is the *first* menuitem in DOM order
    const isFirstItem = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
      return items.length > 0 && items[0] === document.activeElement;
    });
    expect(isFirstItem, "Expected focus to land on the first role=menuitem after ArrowDown").toBe(
      true
    );
  });

  test("ArrowDown on the trigger button opens the menu and focuses the first menuitem", async ({
    page,
  }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings" });
    await settingsBtn.focus();

    // Press ArrowDown directly on the closed trigger
    await page.keyboard.press("ArrowDown");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();

    // The focus is moved inside a requestAnimationFrame callback — wait for it
    // to settle on a menuitem before asserting, to avoid a RAF-timing race.
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("role") === "menuitem"
    );

    const focusedRole = await page.evaluate(
      () => document.activeElement?.getAttribute("role") ?? null
    );
    expect(focusedRole).toBe("menuitem");
  });

  test("Escape closes the menu and returns focus to the settings button", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings" });
    await settingsBtn.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");

    // Menu should be gone
    await expect(menu).not.toBeVisible();

    // Focus must have returned to the settings trigger
    const isTriggerFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return (
        el !== null &&
        el.getAttribute("aria-haspopup") === "menu" &&
        el.getAttribute("aria-label") === "Settings"
      );
    });
    expect(isTriggerFocused, "Expected focus to return to the settings button after Escape").toBe(
      true
    );
  });
});
