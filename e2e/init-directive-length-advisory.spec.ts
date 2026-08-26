/**
 * E2E regression test for the renderer-specific init-directive length caution.
 *
 * OKHP3 produces a long init directive. GitHub has a conservative 500-character
 * field-observed threshold, so the export preview must show its amber caution.
 * mermaid.live has no directive-length ceiling and must not show the caution.
 */

import { expect, test } from "@playwright/test";

const FLOWCHART = "flowchart TD\n  A[Start] --> B[End]";

async function gotoApply(page: import("@playwright/test").Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
  });

  await page.goto("/");
  await page.waitForLoadState("load");
  await expect(page.getByLabel("Select target renderer")).toBeVisible();
}

test.describe("init-directive length advisory", () => {
  test("warns for the long OKHP3 export on GitHub but not mermaid.live", async ({ page }) => {
    await gotoApply(page);

    await page.getByLabel("Mermaid diagram code input").fill(FLOWCHART);

    const rendererSelect = page.getByLabel("Select target renderer");
    await rendererSelect.selectOption("github");

    // GitHub recommends YAML, so explicitly choose the init-directive format
    // that is subject to the renderer's character ceiling.
    const formatGroup = page.getByRole("group", { name: "Theme directive format" });
    await formatGroup.getByRole("button", { name: "%%{init}%%", exact: true }).click();

    const okhp3Tile = page.locator("#apply-palette-tile-overkill-hill");
    await okhp3Tile.click();
    await expect(okhp3Tile).toHaveAttribute("aria-checked", "true");

    // The directive-length caution is rendered when the exact export preview
    // is open, so assert against its semantic alert rather than a CSS class.
    await page.getByRole("button", { name: "Preview", exact: true }).click();

    const lengthAdvisory = page.getByRole("alert", { name: "Directive length advisory" });
    await expect(lengthAdvisory).toBeVisible();
    await expect(lengthAdvisory).toContainText(/(?:exceeds|rendering limit)/i);

    // mermaid.live is the local/reference renderer and has an unlimited
    // directive ceiling, so the same long export must not warn there.
    await rendererSelect.selectOption("mermaid-live");
    await expect(lengthAdvisory).toHaveCount(0);
    await expect(page.getByText(/may exceed.*rendering limit/i)).toHaveCount(0);
  });
});
