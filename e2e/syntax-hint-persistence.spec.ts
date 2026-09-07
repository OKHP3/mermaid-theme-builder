/**
 * E2E coverage for FamilySyntaxHint dismissal persistence.
 *
 * This spec intentionally does not clear localStorage on page reload. The
 * dismissal must survive a real navigation so a broken localStorage write
 * cannot be masked by a test that only checks the same-session state.
 */

import { test, expect } from "@playwright/test";

const FLOWCHART = "flowchart TD\n  A[Start] --> B[End]";
const SEQUENCE = "sequenceDiagram\n  Alice->>Bob: Hello";

test.describe("FamilySyntaxHint dismissal persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("mtb.firstVisit", "true");
      window.sessionStorage.clear();
    });
    await page.goto("/");
    await page.waitForLoadState("load");
  });

  test("dismissed flowchart syntax tip stays hidden after reload", async ({ page }) => {
    const applyTab = page.getByRole("tab", { name: "Apply", exact: true }).first();
    await applyTab.click();

    const input = page.getByLabel("Mermaid diagram code input");
    await input.waitFor({ state: "visible" });
    await input.fill(FLOWCHART);

    const hintBar = page.getByRole("note", { name: "Syntax tips for flowchart" });
    await expect(hintBar).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Dismiss flowchart syntax tip" }).click();
    await expect(hintBar).not.toBeVisible({ timeout: 3000 });

    await page.reload();
    await page.waitForLoadState("load");
    await applyTab.click();
    await input.waitFor({ state: "visible" });
    await input.fill(FLOWCHART);

    await expect(hintBar).not.toBeVisible({ timeout: 3000 });
  });

  test("dismissing flowchart leaves the sequence syntax tip available", async ({ page }) => {
    await page.getByRole("tab", { name: "Apply", exact: true }).first().click();

    const input = page.getByLabel("Mermaid diagram code input");
    await input.waitFor({ state: "visible" });
    await input.fill(FLOWCHART);

    const flowchartHint = page.getByRole("note", { name: "Syntax tips for flowchart" });
    await expect(flowchartHint).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Dismiss flowchart syntax tip" }).click();
    await expect(flowchartHint).not.toBeVisible({ timeout: 3000 });

    await input.fill(SEQUENCE);

    const sequenceHint = page.getByRole("note", { name: "Syntax tips for sequenceDiagram" });
    await expect(sequenceHint).toBeVisible({ timeout: 5000 });
    await expect(flowchartHint).not.toBeVisible();

    // Switching back must not revive the family that was dismissed.
    await input.fill(FLOWCHART);
    await expect(flowchartHint).not.toBeVisible({ timeout: 3000 });
  });
});
