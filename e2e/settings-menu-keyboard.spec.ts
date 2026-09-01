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
 *  4. Pressing ArrowDown / ArrowUp at the menu boundaries wraps focus.
 *  5. Pressing Home / End jumps focus to the menu boundaries.
 *
 * A regression in any of these paths would leave keyboard-only users unable
 * to reach settings (e.g. reset syntax tips or clear palette history).
 */

test.describe("Settings menu keyboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      localStorage.setItem("mtb.firstVisit", "true");
      window.sessionStorage.clear();
    });
    await page.goto("/");
  });

  test("Enter on the settings button opens the menu (role=menu is visible)", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings", exact: true });
    await settingsBtn.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();
  });

  test("Space on the settings button opens the menu (role=menu is visible)", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings", exact: true });
    await settingsBtn.focus();
    await page.keyboard.press("Space");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();
  });

  test("ArrowDown moves focus to the first role=menuitem after opening", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings", exact: true });
    await settingsBtn.focus();

    await page.keyboard.press("Enter");
    await page.getByRole("menu", { name: "Settings" }).waitFor({ state: "visible" });
    await page.keyboard.press("ArrowDown");

    const focusedRole = await page.evaluate(
      () => document.activeElement?.getAttribute("role") ?? null
    );
    expect(focusedRole).toBe("menuitem");

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
    const settingsBtn = page.getByRole("button", { name: "Settings", exact: true });
    await settingsBtn.focus();

    await page.keyboard.press("ArrowDown");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();

    await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "menuitem");

    const focusedRole = await page.evaluate(
      () => document.activeElement?.getAttribute("role") ?? null
    );
    expect(focusedRole).toBe("menuitem");
  });

  test("ArrowUp on the trigger button opens the menu and focuses the last menuitem", async ({
    page,
  }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings", exact: true });
    await settingsBtn.focus();

    await page.keyboard.press("ArrowUp");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();

    // ArrowUp-on-trigger must land on the LAST menuitem (mirror of ArrowDown → first).
    await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "menuitem");

    const isLastItem = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
      return items.length > 0 && items[items.length - 1] === document.activeElement;
    });
    expect(isLastItem, "Expected focus to land on the last role=menuitem after ArrowUp").toBe(true);
  });

  test("ArrowDown from the last menuitem wraps focus to the first menuitem", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings", exact: true });
    await settingsBtn.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();
    const menuItems = page.getByRole("menuitem");
    const itemCount = await menuItems.count();
    expect(itemCount).toBeGreaterThan(1);

    // Open-menu ArrowDown focuses the first item; continue until the last.
    await page.keyboard.press("ArrowDown");
    await expect(menuItems.first()).toBeFocused();
    for (let i = 1; i < itemCount; i += 1) {
      await page.keyboard.press("ArrowDown");
    }
    await expect(menuItems.last()).toBeFocused();

    // ArrowDown at the end must wrap back to the first item.
    await page.keyboard.press("ArrowDown");
    await expect(menuItems.first()).toBeFocused();
  });

  test("ArrowUp from the first menuitem wraps focus to the last menuitem", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings", exact: true });
    await settingsBtn.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();
    const menuItems = page.getByRole("menuitem");

    // Open-menu ArrowDown focuses the first item.
    await page.keyboard.press("ArrowDown");
    await expect(menuItems.first()).toBeFocused();

    // ArrowUp at the beginning must wrap to the last item.
    await page.keyboard.press("ArrowUp");
    await expect(menuItems.last()).toBeFocused();
  });

  test("Home and End move focus to the first and last menuitems", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings", exact: true });
    await settingsBtn.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();
    const menuItems = page.getByRole("menuitem");
    const itemCount = await menuItems.count();
    expect(itemCount).toBeGreaterThan(2);

    // Start from a non-boundary item so both shortcuts are tested as jumps.
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(menuItems.nth(1)).toBeFocused();

    await page.keyboard.press("Home");
    await expect(menuItems.first()).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(menuItems.nth(1)).toBeFocused();

    await page.keyboard.press("End");
    await expect(menuItems.last()).toBeFocused();
  });

  test("Escape closes the menu and returns focus to the settings button", async ({ page }) => {
    const settingsBtn = page.getByRole("button", { name: "Settings", exact: true });
    await settingsBtn.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu", { name: "Settings" });
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(menu).not.toBeVisible();

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
