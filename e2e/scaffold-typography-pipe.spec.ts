/**
 * E2E test: scaffold typography-table pipe escaping.
 *
 * A custom tier font family may contain a "|" character. The prompt scaffold
 * must escape it so Markdown continues to parse it as one Font Family cell.
 */

import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const NODE_LABEL_INPUT = "Node Label font family override";
const PIPE_FONT_FAMILY = "Roboto | Fallback";

async function grantClipboard(context: BrowserContext): Promise<void> {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
}

async function openScaffoldModal(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
  });
  await page.goto("/");
  await page.waitForLoadState("load");

  await page.getByRole("tab", { name: "Compose", exact: true }).click();
  await page.getByRole("button", { name: "Typography", exact: true }).click();

  const fontInput = page.getByRole("textbox", { name: NODE_LABEL_INPUT });
  await fontInput.fill(PIPE_FONT_FAMILY);
  await expect(fontInput).toHaveValue(PIPE_FONT_FAMILY);

  await page.getByRole("button", { name: "Export Theme", exact: true }).click();
  await page.getByRole("button", { name: "Generate Prompt Pattern", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

function typographyRow(scaffold: string, tier: string): string {
  const sectionStart = scaffold.indexOf("## Typography Hierarchy");
  expect(
    sectionStart,
    "copied scaffold must include the Typography Hierarchy section"
  ).toBeGreaterThan(-1);

  const sectionEnd = scaffold.indexOf("\n\n---", sectionStart);
  const typographySection = scaffold.slice(
    sectionStart,
    sectionEnd === -1 ? undefined : sectionEnd
  );
  const row = typographySection.split("\n").find((line) => line.startsWith(`| ${tier} |`));

  expect(row, `${tier} must be present in the copied typography table`).toBeDefined();
  return row!;
}

test.describe("Prompt scaffold typography pipe escaping", () => {
  test("copies a tier font family pipe as an escaped Markdown table value", async ({
    page,
    context,
  }) => {
    await grantClipboard(context);
    await openScaffoldModal(page);

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button").filter({ hasText: "Format A" }).first().click();

    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain("## Typography Hierarchy");

    const copiedScaffold = await page.evaluate(() => navigator.clipboard.readText());
    const nodeLabelRow = typographyRow(copiedScaffold, "Node Label");

    expect(nodeLabelRow).toContain("| Roboto \\| Fallback |");
    expect(nodeLabelRow.match(/(?<!\\)\|/g)).toHaveLength(5);
  });
});
