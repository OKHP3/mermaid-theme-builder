/**
 * E2E coverage for Compose's custom theme-name input.
 *
 * The exact built-in palette name must still be treated as an explicit custom
 * name. This closes the loop between the Compose input binding and the
 * exporter's customThemeName handling.
 */

import { test, expect } from "@playwright/test";

const PALETTE_ID = "overkill-hill";
const PALETTE_NAME = "OKHP3";
const FIRST_VISIT_KEY = "mtb.firstVisit";

test("custom theme name matching the palette name is preserved in Markdown export", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.addInitScript((firstVisitKey: string) => {
    window.localStorage.clear();
    window.localStorage.setItem(firstVisitKey, "true");
    window.sessionStorage.clear();
  }, FIRST_VISIT_KEY);

  await page.goto("/");
  await page.waitForLoadState("load");
  await page.getByRole("tab", { name: "Compose", exact: true }).click();

  const paletteTile = page.locator(`#compose-palette-tile-${PALETTE_ID}`);
  await paletteTile.waitFor({ state: "visible", timeout: 8_000 });
  await paletteTile.click();

  const exportSection = page.getByRole("button", { name: "Export Theme", exact: true });
  await exportSection.click();

  const themeNameInput = page.getByPlaceholder(PALETTE_NAME);
  await expect(themeNameInput).toBeVisible();
  await themeNameInput.fill(PALETTE_NAME);

  const markdownButton = page.getByRole("button", { name: "Export as Markdown", exact: true });
  await expect(markdownButton).toBeEnabled();
  await markdownButton.click();
  await expect(page.getByRole("button", { name: "Copied!", exact: true })).toBeVisible({
    timeout: 3_000,
  });

  const markdown = await page.evaluate(() => navigator.clipboard.readText());
  expect(markdown).toContain(`Custom — based on ${PALETTE_NAME}`);
});
