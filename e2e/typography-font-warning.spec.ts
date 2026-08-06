/**
 * E2E tests: typography tier font-family injection-character warning.
 *
 * Purpose
 * -------
 * The ComposeTab typography section renders an inline amber warning when a
 * font-family input contains ; { or } (characters that corrupt CSS output if
 * emitted verbatim).  Unit tests cover the `hasFontFamilyInjectionChars`
 * helper, but this spec confirms the warning actually renders in the running
 * browser and clears when the unsafe character is removed.
 *
 * Strategy
 * --------
 * - Load the app at "/" (Compose tab is the default).
 * - Click the "Typography" accordion to expand it.
 * - Locate the "Node Label font family override" input (the nodeLabel tier,
 *   which has `aria-label="Node Label font family override"`).
 * - Type a value containing ";" — the warning must appear.
 * - Clear the input — the warning must disappear.
 * - Repeat with "{" and "}" to cover all three unsafe characters.
 *
 * The warning element is a <p> containing "Contains ; { or } — stripped on export"
 * (rendered by the `hasFontFamilyInjectionChars` guard in ComposeTab.tsx).
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The exact warning text rendered by ComposeTab.tsx lines 992-996. */
const WARNING_TEXT = "stripped on export";

/** aria-label for the nodeLabel tier font family input. */
const NODE_LABEL_INPUT = "Node Label font family override";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the app and expand the Typography accordion on the Compose tab.
 * Compose is the default active tab so no extra tab click is needed.
 */
async function openTypographySection(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("load");

  const typographyButton = page.getByRole("button", { name: "Typography" });
  await typographyButton.waitFor({ timeout: 8_000 });
  await typographyButton.click();

  // Wait for the font family input to confirm the section is expanded.
  await page.getByRole("textbox", { name: NODE_LABEL_INPUT }).waitFor({ timeout: 4_000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Typography font-family injection-character warning", () => {
  test("warning appears after typing a semicolon into the Node Label font family input", async ({
    page,
  }) => {
    await openTypographySection(page);

    const input = page.getByRole("textbox", { name: NODE_LABEL_INPUT });
    await input.fill("Roboto; color: red");

    await expect(page.getByText(WARNING_TEXT)).toBeVisible({ timeout: 3_000 });
  });

  test("warning disappears after clearing the unsafe value", async ({ page }) => {
    await openTypographySection(page);

    const input = page.getByRole("textbox", { name: NODE_LABEL_INPUT });

    // Type unsafe value first.
    await input.fill("Roboto; color: red");
    await expect(page.getByText(WARNING_TEXT)).toBeVisible({ timeout: 3_000 });

    // Clear the input — warning must go away.
    await input.fill("");
    await expect(page.getByText(WARNING_TEXT)).not.toBeVisible({ timeout: 3_000 });
  });

  test("warning appears for an opening brace { in the font family", async ({ page }) => {
    await openTypographySection(page);

    const input = page.getByRole("textbox", { name: NODE_LABEL_INPUT });
    await input.fill("Font{Name");

    await expect(page.getByText(WARNING_TEXT)).toBeVisible({ timeout: 3_000 });
  });

  test("warning appears for a closing brace } in the font family", async ({ page }) => {
    await openTypographySection(page);

    const input = page.getByRole("textbox", { name: NODE_LABEL_INPUT });
    await input.fill("Font}Name");

    await expect(page.getByText(WARNING_TEXT)).toBeVisible({ timeout: 3_000 });
  });

  test("no warning for a safe font-family value", async ({ page }) => {
    await openTypographySection(page);

    const input = page.getByRole("textbox", { name: NODE_LABEL_INPUT });
    await input.fill("Inter, 'DM Sans', sans-serif");

    await expect(page.getByText(WARNING_TEXT)).not.toBeVisible({ timeout: 3_000 });
  });
});
