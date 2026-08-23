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
    localStorage.setItem("mtb.firstVisit", "true");
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

// ---------------------------------------------------------------------------
// Test 11 — Download .md with a custom theme name: heading and attribution use
//            the custom name, not the default palette name
// ---------------------------------------------------------------------------

test("Download → .md heading carries the custom theme name and shows 'Custom — based on'", async ({
  page,
}) => {
  // The user-entered theme name is stored as `n` in the persisted state blob
  // (key: "mtb.state.v1").  Seed it via addInitScript so it is present before
  // React initialises — the same pattern used in my-theme-slots.spec.ts.
  const CUSTOM_NAME = "My Custom Theme";

  await page.addInitScript(
    ({
      stateKey,
      stateValue,
      firstVisitKey,
    }: {
      stateKey: string;
      stateValue: string;
      firstVisitKey: string;
    }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(firstVisitKey, "true");
      localStorage.setItem(stateKey, stateValue);
    },
    {
      stateKey: "mtb.state.v1",
      stateValue: JSON.stringify({
        schemaVersion: 1,
        firstVisitComplete: true,
        // Pin to the first built-in brand palette so Theme ID and Version
        // assertions are deterministic across runs.
        selectedPaletteId: "overkill-hill",
        // myThemeSlots must be present (even as an empty array) for the
        // hydration effect to enter the slot-ID branch. Without it the entire
        // block is skipped and activeMyThemeSlotId stays at its useState
        // default of "my-theme-1", making effectiveCustomThemeName come from
        // the slot name rather than from customThemeName.
        myThemeSlots: [],
        activeMyThemeSlotId: null,
        customThemeName: CUSTOM_NAME,
      }),
      firstVisitKey: "mtb.firstVisit",
    }
  );

  await page.goto("/");
  await page.waitForLoadState("load");
  await page.getByRole("tab", { name: "Apply" }).first().click();
  await page.getByLabel("Mermaid diagram code input").waitFor({ state: "visible" });

  // Paste a flowchart so the export controls become active.
  await page.getByLabel("Mermaid diagram code input").fill(FLOWCHART);

  // Open the download menu and download the .md file.
  const downloadBtn = page.getByRole("button", { name: "Download" });
  await expect(downloadBtn).toBeEnabled();
  await downloadBtn.click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: ".md" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.md$/);

  const filePath = await download.path();
  expect(filePath).toBeTruthy();
  const content = readFileSync(filePath!, "utf8");

  // 1. The H1 heading must embed the custom name, not the default palette name.
  //    generateMarkdownExport writes: `# Mermaid Diagram — {themeName} Theme`
  expect(content).toContain(`# Mermaid Diagram — ${CUSTOM_NAME} Theme`);

  // 2. The Theme attribution line must show the "Custom — based on" prefix,
  //    confirming the isCustom branch of generateMarkdownExport was taken.
  expect(content).toContain("Custom — based on");

  // 3. The full palette metadata must survive the custom-name branch — a
  //    regression that drops Theme ID or Version would otherwise pass silently.
  //    "overkill-hill" version comes from BUILTIN_PALETTES in src/lib/palettes.ts.
  expect(content).toContain("**Theme ID:** `overkill-hill`");
  expect(content).toContain("**Version:** 0.2.0");

  // 4. The %%{init}%% directive must still be present.
  expect(content).toContain("%%{init:");

  // 5. The fenced Mermaid code block must be present.
  expect(content).toContain("```mermaid");
});

// ---------------------------------------------------------------------------
// Test 14 — Markdown clipboard copy with a custom theme name: heading and
//            attribution use the custom name, not the default palette name
// ---------------------------------------------------------------------------

test("'Markdown' copy carries the custom theme name and shows 'Custom — based on'", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  const CUSTOM_NAME = "My Custom Theme";

  // Seed the persisted state before React initialises.  `myThemeSlots` must
  // be present, even as an empty array, so hydration applies the null active
  // slot and preserves customThemeName instead of using the default slot name.
  await page.addInitScript(
    ({
      stateKey,
      stateValue,
      firstVisitKey,
    }: {
      stateKey: string;
      stateValue: string;
      firstVisitKey: string;
    }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(firstVisitKey, "true");
      localStorage.setItem(stateKey, stateValue);
    },
    {
      stateKey: "mtb.state.v1",
      stateValue: JSON.stringify({
        schemaVersion: 1,
        firstVisitComplete: true,
        selectedPaletteId: "overkill-hill",
        myThemeSlots: [],
        activeMyThemeSlotId: null,
        customThemeName: CUSTOM_NAME,
      }),
      firstVisitKey: "mtb.firstVisit",
    }
  );

  await page.goto("/");
  await page.waitForLoadState("load");
  await page.getByRole("tab", { name: "Apply" }).first().click();
  await page.getByLabel("Mermaid diagram code input").waitFor({ state: "visible" });
  await page.getByLabel("Mermaid diagram code input").fill(FLOWCHART);

  const markdownBtn = page.getByRole("button", { name: "Markdown" });
  await expect(markdownBtn).toBeEnabled();
  await markdownBtn.click();
  await expect(page.getByRole("button", { name: /Copied!/ })).toBeVisible({ timeout: 3000 });

  const content = await page.evaluate(() => navigator.clipboard.readText());

  expect(content).toContain(`# Mermaid Diagram — ${CUSTOM_NAME} Theme`);
  expect(content).toContain("Custom — based on");
  expect(content).toContain("```mermaid");
  expect(content).toContain("%%{init:");
});

// ---------------------------------------------------------------------------
// Test 12 — Download and copy buttons are disabled before diagram code is
//            pasted, enabled after
// ---------------------------------------------------------------------------

test("Download and copy buttons are disabled before code is pasted and enabled after", async ({
  page,
}) => {
  await gotoApply(page);

  const textarea = page.getByLabel("Mermaid diagram code input");
  const downloadBtn = page.getByRole("button", { name: "Download" });
  const styledCodeBtn = page.getByRole("button", { name: "Styled Code" });
  const markdownBtn = page.getByRole("button", { name: "Markdown" });
  await expect(downloadBtn).toBeVisible();
  await expect(styledCodeBtn).toBeVisible();
  await expect(markdownBtn).toBeVisible();

  // The Apply tab pre-populates a default diagram. Clear it to reach the
  // "no code yet" state that the disabled guard targets.
  await textarea.fill("");

  // With an empty textarea the guard `disabled={!inputCode.trim()}` must keep
  // all diagram-dependent export buttons disabled.
  await expect(downloadBtn).toBeDisabled();
  await expect(styledCodeBtn).toBeDisabled();
  await expect(markdownBtn).toBeDisabled();

  // Pasting a flowchart must lift the disabled state for all three controls.
  await pasteDiagram(page, FLOWCHART);
  await expect(downloadBtn).toBeEnabled();
  await expect(styledCodeBtn).toBeEnabled();
  await expect(markdownBtn).toBeEnabled();
});

// ---------------------------------------------------------------------------
// Test 15 — keyboard copy shortcut refuses empty input and copies styled code
//            for a valid diagram
// ---------------------------------------------------------------------------

test("Ctrl+Shift+C does not copy empty input and copies styled code for a flowchart", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoApply(page);

  const textarea = page.getByLabel("Mermaid diagram code input");
  const applyTab = page.getByRole("tab", { name: "Apply" }).first();
  const sentinel = "clipboard must remain unchanged";

  // Seed the clipboard so a no-op is observable, then clear the default
  // diagram. Focus the Apply tab before pressing the shortcut so the
  // textarea's typing guard does not intentionally swallow the event.
  await page.evaluate((value) => navigator.clipboard.writeText(value), sentinel);
  await textarea.fill("");
  await expect(textarea).toHaveValue("");
  for (const shortcut of ["Control+Shift+C", "Meta+Shift+C"]) {
    await applyTab.press(shortcut);
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(sentinel);
  }
  await expect(page.getByRole("button", { name: "Styled Code" })).not.toHaveAttribute(
    "aria-label",
    "Copied!"
  );

  // A valid diagram must still travel through the same shortcut path and
  // copy the themed export rather than the raw source.
  await pasteDiagram(page, FLOWCHART);
  await applyTab.press("Control+Shift+C");
  await expect(page.getByRole("button", { name: /Copied!/ })).toBeVisible({ timeout: 3000 });

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("%%{init:");
  expect(copied).toContain("flowchart TD");
  expect(copied).toContain("themeVariables");

  await applyTab.press("Meta+Shift+C");
  await expect(page.getByRole("button", { name: /Copied!/ })).toBeVisible({ timeout: 3000 });
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(copied);
});

// ---------------------------------------------------------------------------
// Test 13 — Live Editor URL encodes themed code after a palette switch
// ---------------------------------------------------------------------------

test("Live Editor URL payload encodes themed code after a palette switch", async ({ page }) => {
  await gotoApply(page);
  await pasteDiagram(page, FLOWCHART);

  // Switch to the second brand palette tile so we exercise a non-default
  // palette — same selection technique as the clipboard palette-switch test.
  const paletteTiles = page.locator('[role="radio"][id^="apply-palette-tile-"]');
  await expect(paletteTiles.nth(1)).toBeVisible();
  await paletteTiles.nth(1).click();

  const liveEditorBtn = page.getByRole("button", { name: "Live Editor" });
  await expect(liveEditorBtn).toBeEnabled();

  const popupPromise = page.waitForEvent("popup");
  await liveEditorBtn.click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");

  const url = popup.url();
  expect(url).toMatch(/^https:\/\/mermaid\.live/);

  // Decode the URL-safe base64 payload.
  // Format: https://mermaid.live/edit#base64:<urlSafeBase64(utf8(JSON(state)))>
  // URL-safe encoding swaps +→- and /→_ and strips trailing = padding.
  const fragment = url.split("#base64:")[1];
  expect(fragment).toBeTruthy();

  const standard = fragment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard + "=".repeat((4 - (standard.length % 4)) % 4);
  const decoded = Buffer.from(padded, "base64").toString("utf8");
  const state = JSON.parse(decoded) as { code: string };

  // The %%{init}%% directive proves the palette theme was injected —
  // a regression that sends bare un-themed code would fail this check.
  expect(state.code).toContain("%%{init:");

  // The original diagram source must also be present.
  expect(state.code).toContain("flowchart TD");
});
