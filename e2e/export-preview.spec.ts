/**
 * E2E coverage for the Apply tab's export preview pane.
 *
 * The preview is intentionally persisted in its own localStorage key because
 * Apply remains mounted while users move between tabs. These tests exercise
 * the visible pane, its clipboard copy path, the renderer-length advisory, and
 * the full factory-reset behavior.
 */

import { expect, test, type Page } from "@playwright/test";

const FLOWCHART = "flowchart TD\n  A[Start] --> B[End]";
const EXPORT_PREVIEW_OPEN_KEY = "mtb.exportPreview.open";

async function gotoApply(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
  });
  await page.goto("/#apply");
  await page.waitForLoadState("load");
  await expect(page.getByLabel("Mermaid diagram code input")).toBeVisible();
}

async function openPreview(page: Page): Promise<void> {
  const previewToggle = page.getByRole("button", { name: "Preview", exact: true });
  await expect(previewToggle).toBeVisible();
  await previewToggle.click();
  await expect(page.getByTestId("export-preview-pane")).toBeVisible();
}

test.describe("Apply export preview", () => {
  test("opens the pane and shows the monospace export code", async ({ page }) => {
    await gotoApply(page);
    await page.getByLabel("Mermaid diagram code input").fill(FLOWCHART);
    await openPreview(page);

    const codePreview = page.getByLabel("Export code preview");
    await expect(codePreview).toBeVisible();
    await expect(codePreview).toHaveClass(/font-mono/);
    await expect(codePreview).toContainText("%%{init:");
    await expect(codePreview).toContainText("flowchart");
  });

  test("copies the exact preview code and flashes Copied!", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await gotoApply(page);
    await page.getByLabel("Mermaid diagram code input").fill(FLOWCHART);
    await openPreview(page);

    const expectedCode = await page.getByLabel("Export code preview").textContent();
    expect(expectedCode).not.toBeNull();

    await page.getByRole("button", { name: "Copy export code from preview" }).click();
    await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();

    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expectedCode);
  });

  test("keeps the pane open across Apply → Reference → Apply navigation", async ({ page }) => {
    await gotoApply(page);
    await page.getByLabel("Mermaid diagram code input").fill(FLOWCHART);
    await openPreview(page);
    expect(await page.evaluate((key) => localStorage.getItem(key), EXPORT_PREVIEW_OPEN_KEY)).toBe(
      "true"
    );

    await page.getByRole("tab", { name: "Reference" }).first().click();
    await expect(page.getByRole("tabpanel", { name: "Reference" })).toBeVisible();
    await page.getByRole("tab", { name: "Apply" }).first().click();

    await expect(page.getByTestId("export-preview-pane")).toBeVisible();
    await expect(page.getByRole("button", { name: "Hide", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("shows the directive-length advisory inside the open pane", async ({ page }) => {
    await gotoApply(page);
    await page.getByLabel("Mermaid diagram code input").fill(FLOWCHART);
    await page.getByLabel("Select target renderer").selectOption("github");
    await page
      .getByRole("group", { name: "Theme directive format" })
      .getByRole("button", {
        name: "%%{init}%%",
        exact: true,
      })
      .click();
    await page.locator("#apply-palette-tile-overkill-hill").click();
    await openPreview(page);

    const previewPane = page.getByTestId("export-preview-pane");
    await expect(
      previewPane.getByRole("alert", { name: "Directive length advisory" })
    ).toBeVisible();
    await expect(previewPane).toContainText(/exceeds.*500-char limit/i);
  });

  test("collapses and clears the pane when all settings are cleared", async ({ page }) => {
    await gotoApply(page);
    await page.getByLabel("Mermaid diagram code input").fill(FLOWCHART);
    await openPreview(page);
    expect(await page.evaluate((key) => localStorage.getItem(key), EXPORT_PREVIEW_OPEN_KEY)).toBe(
      "true"
    );

    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("menuitem", { name: "Clear all settings", exact: true }).click();

    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), EXPORT_PREVIEW_OPEN_KEY))
      .toBeNull();
    await expect(page.getByTestId("export-preview-pane")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Preview", exact: true })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});
