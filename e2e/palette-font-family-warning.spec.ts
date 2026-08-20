/**
 * E2E test: palette-editor font-family injection-character warning.
 *
 * The ColorSwatch font-family input appears in Apply's "Edit Colors" drawer.
 * This verifies the warning rendered by that real browser UI, rather than only
 * the hasFontFamilyInjectionChars helper or the separate Compose typography
 * controls.
 */

import { test, expect, type Page } from "@playwright/test";

const WARNING_TEXT = "unsafe characters will be stripped from the export";
const FONT_FAMILY_INPUT = "Font family for Font family";

async function openMyThemeColorEditor(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
  });

  await page.goto("/");
  await page.waitForLoadState("load");

  // Confirm the default My Theme workspace is active from the Compose tab
  // before moving to the Apply-only color-editor drawer.
  await page.getByRole("tab", { name: /Compose/i }).click();
  const myThemeSlot = page.locator("#compose-palette-tile-my-theme-1");
  await expect(myThemeSlot).toHaveAttribute("aria-checked", "true");

  await page.getByRole("tab", { name: /Apply/i }).click();
  await page.getByRole("button", { name: "Edit Colors" }).click();

  const editor = page.getByRole("dialog", { name: /Edit colors for My Theme 1/i });
  await expect(editor).toBeVisible();
  await editor.getByRole("textbox", { name: FONT_FAMILY_INPUT }).waitFor();
}

test.describe("Palette editor font-family injection-character warning", () => {
  test("appears for a semicolon and disappears after entering a safe font family", async ({
    page,
  }) => {
    await openMyThemeColorEditor(page);

    const editor = page.getByRole("dialog", { name: /Edit colors for My Theme 1/i });
    const input = editor.getByRole("textbox", { name: FONT_FAMILY_INPUT });
    const warning = editor.getByText(WARNING_TEXT);

    await input.fill("Roboto; color: red");
    await expect(warning).toBeVisible();

    await input.fill("Roboto");
    await expect(warning).not.toBeVisible();
  });
});
