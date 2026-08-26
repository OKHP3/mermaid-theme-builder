/**
 * E2E regression coverage for renderer-specific directive warnings in the
 * Prompt Scaffold modal.
 */

import { expect, test, type Page } from "@playwright/test";

const FLOWCHART = "flowchart TD\n  A[Start] --> B[End]";

async function openScaffoldModal(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
  });

  await page.goto("/");
  await page.waitForLoadState("load");
  await page.getByLabel("Mermaid diagram code input").fill(FLOWCHART);

  const rendererSelect = page.getByLabel("Select target renderer");
  await rendererSelect.selectOption("github");

  const okhp3Tile = page.locator("#apply-palette-tile-overkill-hill");
  await okhp3Tile.click();
  await expect(okhp3Tile).toHaveAttribute("aria-checked", "true");

  const trigger = page.getByRole("button", { name: /Prompt Scaffold/ });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Generate Prompt Pattern" })).toBeVisible();
}

test.describe("Prompt Scaffold directive-length advisory", () => {
  test("warns before init-containing copies for GitHub and clears for mermaid.live", async ({
    page,
  }) => {
    await openScaffoldModal(page);

    const dialog = page.getByRole("dialog", { name: "Generate Prompt Pattern" });
    const formatAAdvisory = dialog.getByRole("alert", {
      name: "Directive length advisory for Format A",
    });
    const bothAdvisory = dialog.getByRole("alert", {
      name: "Directive length advisory for All",
    });

    await expect(formatAAdvisory).toBeVisible();
    await expect(formatAAdvisory).toContainText(/may exceed.*rendering limit/i);
    await expect(bothAdvisory).toBeVisible();
    await expect(bothAdvisory).toContainText(/may exceed.*rendering limit/i);

    // Format B is YAML-only and does not contain an init directive to warn about.
    await expect(
      dialog.getByRole("alert", { name: "Directive length advisory for Format B" })
    ).toHaveCount(0);

    const scaffoldRenderer = dialog.getByLabel("Select target renderer for scaffold");
    await scaffoldRenderer.selectOption("mermaid-live");
    await expect(formatAAdvisory).toHaveCount(0);
    await expect(bothAdvisory).toHaveCount(0);
  });
});
