/**
 * E2E tests for the core Apply Tab pipeline: paste → detect → theme → export.
 *
 * Covers the highest-impact untested path identified in TD-01 of
 * docs/technical-debt-register.md:
 *   1. Paste Mermaid code → family auto-detected and chip updated
 *   2. Paste code → "Styled Code" button flashes "Copied!" on click
 *   3. Paste code → clipboard contains themed %%{init}%% block after copy
 *   4. Switch palette → clipboard output reflects the new palette's colors
 *   5. Paste code → Download menu → .mermaid file download fires
 *   6. Paste code → Download menu → .theme.json file download fires
 *   7. Paste sequence diagram → chip detects "Sequence Diagram" family
 *
 * Strategy:
 *   - Seed localStorage via addInitScript() before React initialises to
 *     avoid races with the default first render.
 *   - Navigate to #apply after load so tests are not coupled to the default
 *     landing tab.
 *   - Grant clipboard-read and clipboard-write permissions at the context
 *     level for tests that verify copied text.
 *   - Use page.waitForEvent("download") for download assertions so no
 *     actual file I/O is required.
 */

import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FLOWCHART = "flowchart TD\n  A[Start] --> B[End]";
const SEQUENCE = "sequenceDiagram\n  Alice->>Bob: Hello";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the Apply tab from a fresh page load. */
async function gotoApply(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.getByRole("tab", { name: "Apply" }).first().click();
  // Wait for the diagram code input to be visible before interacting.
  await page.getByLabel("Mermaid diagram code input").waitFor({ state: "visible" });
}

/** Clear the input and type (fill) new diagram code. */
async function pasteDiagram(page: Page, code: string) {
  const input = page.getByLabel("Mermaid diagram code input");
  await input.fill(code);
}

// ---------------------------------------------------------------------------
// Test 1 — paste flowchart → family chip shows "Flowchart"
// ---------------------------------------------------------------------------

test("paste flowchart → family chip auto-detects 'Flowchart'", async ({ page }) => {
  await gotoApply(page);
  await pasteDiagram(page, FLOWCHART);

  // The family chip button's visible text is exactly the detected label.
  // For a flowchart diagram, the detector returns label "Flowchart".
  await expect(
    page
      .locator("button")
      .filter({ hasText: /^Flowchart$/ })
      .first()
  ).toBeVisible({ timeout: 5000 });
});

// ---------------------------------------------------------------------------
// Test 2 — "Styled Code" button flashes "Copied!" after click
// ---------------------------------------------------------------------------

test("'Styled Code' button flashes 'Copied!' after click", async ({ page }) => {
  await gotoApply(page);
  await pasteDiagram(page, FLOWCHART);

  const styledCodeBtn = page.getByRole("button", { name: "Styled Code" });
  await expect(styledCodeBtn).toBeVisible();
  await expect(styledCodeBtn).toBeEnabled();

  await styledCodeBtn.click();

  // Button should immediately show "Copied!".
  await expect(page.getByRole("button", { name: /Copied!/ })).toBeVisible({ timeout: 3000 });

  // After the 2 s timeout the button reverts to "Styled Code".
  await expect(page.getByRole("button", { name: "Styled Code" })).toBeVisible({ timeout: 5000 });
});

// ---------------------------------------------------------------------------
// Test 3 — clipboard contains %%{init}%% themed block after copy
// ---------------------------------------------------------------------------

test("clipboard contains %%{init}%% themed Mermaid block after 'Styled Code' click", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoApply(page);
  await pasteDiagram(page, FLOWCHART);

  await page.getByRole("button", { name: "Styled Code" }).click();
  await page.getByRole("button", { name: /Copied!/ }).waitFor({ state: "visible" });

  const clipText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipText).toContain("%%{init:");
  expect(clipText).toContain("flowchart");
  // Themed output embeds themeVariables.
  expect(clipText).toContain("themeVariables");
});

// ---------------------------------------------------------------------------
// Test 4 — switching palette changes the themed output in the clipboard
// ---------------------------------------------------------------------------

test("switching palette changes the themed output copied to clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoApply(page);
  await pasteDiagram(page, FLOWCHART);

  // Copy with the default (first) palette.
  await page.getByRole("button", { name: "Styled Code" }).click();
  await page.getByRole("button", { name: /Copied!/ }).waitFor({ state: "visible" });
  const firstOutput = await page.evaluate(() => navigator.clipboard.readText());
  expect(firstOutput).toContain("%%{init:");

  // Wait for the button to revert so the second click is clean.
  await page.getByRole("button", { name: "Styled Code" }).waitFor({ state: "visible" });

  // Click the second brand palette tile in the Apply tab palette selector.
  // The tiles use id="apply-palette-tile-<paletteId>" and role="radio".
  const paletteTiles = page.locator('[role="radio"][id^="apply-palette-tile-"]');
  const tileCount = await paletteTiles.count();
  expect(tileCount).toBeGreaterThanOrEqual(2);

  // Click the second tile (index 1) — guaranteed to differ from the first.
  await paletteTiles.nth(1).click();

  // Copy again with the new palette.
  await page.getByRole("button", { name: "Styled Code" }).click();
  await page.getByRole("button", { name: /Copied!/ }).waitFor({ state: "visible" });
  const secondOutput = await page.evaluate(() => navigator.clipboard.readText());
  expect(secondOutput).toContain("%%{init:");

  // The two outputs should differ — the palette colors are embedded in the
  // %%{init}%% block, so a palette switch always produces different text.
  expect(firstOutput).not.toBe(secondOutput);
});

// ---------------------------------------------------------------------------
// Test 5 — Download menu → .mermaid file download fires
// ---------------------------------------------------------------------------

test("Download → .mermaid triggers a file download with a .mermaid filename", async ({ page }) => {
  await gotoApply(page);
  await pasteDiagram(page, FLOWCHART);

  // Open the download menu.
  const downloadBtn = page.getByRole("button", { name: "Download" });
  await expect(downloadBtn).toBeEnabled();
  await downloadBtn.click();

  // The menu item text is ".mermaid" (from DOWNLOAD_LABELS).
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: ".mermaid" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.mermaid$/);
});

// ---------------------------------------------------------------------------
// Test 6 — Download menu → .theme.json file download fires
// ---------------------------------------------------------------------------

test("Download → .theme.json triggers a file download with a .json filename", async ({ page }) => {
  await gotoApply(page);
  await pasteDiagram(page, FLOWCHART);

  await page.getByRole("button", { name: "Download" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: ".theme.json" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.json$/);
});

// ---------------------------------------------------------------------------
// Test 8 — "Markdown" copy button copies a fenced code block to clipboard
// ---------------------------------------------------------------------------

test("'Markdown' copy button copies a ```mermaid fenced block with %%{init}%% to clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoApply(page);
  await pasteDiagram(page, FLOWCHART);

  const markdownBtn = page.getByRole("button", { name: "Markdown" });
  await expect(markdownBtn).toBeVisible();
  await expect(markdownBtn).toBeEnabled();
  await markdownBtn.click();

  // Button should flash "Copied!" immediately.
  await expect(page.getByRole("button", { name: /Copied!/ })).toBeVisible({ timeout: 3000 });

  const clipText = await page.evaluate(() => navigator.clipboard.readText());

  // Must contain the fenced Mermaid code block.
  expect(clipText).toContain("```mermaid");

  // The %%{init: block carries the palette theme variables — this is the
  // critical regression check: if generateMarkdownExport drops the init
  // directive the diagram will render without the chosen theme.
  expect(clipText).toContain("%%{init:");

  // The original diagram source must survive inside the fenced block.
  expect(clipText).toContain("flowchart TD");
});

// ---------------------------------------------------------------------------
// Test 9 — Download menu → .md file contains fenced code block + %%{init}%%
// ---------------------------------------------------------------------------

test("Download → .md file contains a ```mermaid fenced block with %%{init}%% metadata", async ({
  page,
}) => {
  await gotoApply(page);
  await pasteDiagram(page, FLOWCHART);

  // Open the download menu.
  const downloadBtn = page.getByRole("button", { name: "Download" });
  await expect(downloadBtn).toBeEnabled();
  await downloadBtn.click();

  // The menu item for Markdown shows the label ".md" (from DOWNLOAD_LABELS).
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: ".md" }).click();
  const download = await downloadPromise;

  // 1. Filename must end in .md.
  expect(download.suggestedFilename()).toMatch(/\.md$/);

  // 2. File content must contain a fenced ```mermaid code block.
  //    generateMarkdownExport always wraps the themed code in:
  //      ```mermaid
  //      %%{init: ...}%%
  //      <diagram code>
  //      ```
  const filePath = await download.path();
  expect(filePath).toBeTruthy();
  const content = readFileSync(filePath!, "utf8");

  expect(content).toContain("```mermaid");

  // 3. The %%{init}%% directive must be present — this is the critical
  //    palette metadata that applies the theme.  A regression in
  //    generateMarkdownExport that drops the init block would be caught here.
  expect(content).toContain("%%{init:");

  // 4. The original diagram code must survive inside the block.
  expect(content).toContain("flowchart TD");
});

// ---------------------------------------------------------------------------
// Test 7 — paste sequence diagram → chip detects "Sequence Diagram"
// ---------------------------------------------------------------------------

test("paste sequenceDiagram → family chip shows 'Sequence Diagram'", async ({ page }) => {
  await gotoApply(page);
  await pasteDiagram(page, SEQUENCE);

  await expect(
    page
      .locator("button")
      .filter({ hasText: /^Sequence Diagram$/ })
      .first()
  ).toBeVisible({ timeout: 5000 });
});

// ---------------------------------------------------------------------------
// Test 10 — Live Editor button opens mermaid.live in a new tab
// ---------------------------------------------------------------------------

test("Live Editor button opens mermaid.live in a new tab", async ({ page }) => {
  await gotoApply(page);
  await pasteDiagram(page, FLOWCHART);

  const liveEditorBtn = page.getByRole("button", { name: "Live Editor" });
  await expect(liveEditorBtn).toBeVisible();
  await expect(liveEditorBtn).toBeEnabled();

  // window.open(..., "_blank", "noopener,noreferrer") triggers a Playwright popup event.
  const popupPromise = page.waitForEvent("popup");
  await liveEditorBtn.click();
  const popup = await popupPromise;

  // The URL is built synchronously in openInLiveEditor() before window.open is called,
  // so the popup already has the full mermaid.live URL on navigation start.
  await popup.waitForLoadState("domcontentloaded");
  expect(popup.url()).toMatch(/^https:\/\/mermaid\.live/);
});
