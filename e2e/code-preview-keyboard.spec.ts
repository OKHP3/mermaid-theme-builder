/**
 * Browser coverage for Code preview keyboard handling.
 *
 * The Code panel's <pre> is keyboard-focusable so Enter can open the editor.
 * Space must remain non-destructive: it must not switch the panel to edit mode.
 */

import { test, expect, type Page } from "@playwright/test";

const FLOWCHART = "flowchart TD\n  A[Start] --> B[End]";

async function gotoCodePreview(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
    window.sessionStorage.clear();
  });

  await page.goto("/");
  await page.waitForLoadState("load");
  await page.getByRole("tab", { name: "Apply", exact: true }).click();

  const input = page.getByLabel("Mermaid diagram code input");
  await input.fill(FLOWCHART);
  await page.getByRole("tab", { name: "code", exact: true }).click();
}

test("Space on Code preview keeps the styled output out of edit mode", async ({ page }) => {
  await gotoCodePreview(page);

  const codePreview = page.locator('pre[aria-label="Styled code output"]');
  const codeEditor = page.locator(
    'textarea[aria-label="Styled code output — edit before copying"]'
  );
  await expect(codePreview).toBeVisible();

  await codePreview.focus();
  await page.keyboard.press("Space");

  await expect(codePreview).toBeVisible();
  await expect(codeEditor).toHaveCount(0);
});
