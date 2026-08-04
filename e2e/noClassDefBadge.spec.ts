/**
 * E2E test — 'No classDef' badge in the download dropdown (Task #412).
 *
 * The component tests (Task #326) verify the badge renders in happy-dom.
 * This spec exercises the full browser path: paste a non-classDef diagram,
 * open the Download menu, and assert the badge is visible on both the
 * scaffold (.txt) and markdown (.md) rows.  A second test confirms the badge
 * is absent when a flowchart (which supports classDef) is active.
 *
 * The badge is controlled by `promptIsThemeOnly` in ExportToolbar.tsx, which
 * is true when the detected family is not in CLASSDEF_CAPABLE_FAMILIES.
 * Sankey diagrams are not classDef-capable and are a reliable trigger.
 *
 * Strategy:
 *   - Seed localStorage via addInitScript() to get a clean state.
 *   - Navigate to the Apply tab, paste the diagram, wait for detection.
 *   - Click Download to open the popover, then assert badge text visibility.
 *
 * Download popover structure (ExportToolbar.tsx ~line 370):
 *   <div class="absolute right-0 bottom-full z-40 min-w-[180px] ...">
 *     <button ...>
 *       <span>{DOWNLOAD_LABELS[t]}</span>    ← e.g. ".md" or ".txt"
 *       <span>bootstrap / prompt · No classDef</span>
 *     </button>
 *     …
 *   </div>
 *
 * The row buttons are located by scoping to the popover container and then
 * filtering by a child <span> whose text exactly matches the download label
 * (".md" or ".txt"). This avoids matching on the full button text content
 * which includes the badge annotation.
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Sankey diagram — not in CLASSDEF_CAPABLE_FAMILIES → promptIsThemeOnly = true. */
const SANKEY = `sankey-beta

A,B,10
B,C,5
B,D,5`;

/** Flowchart — in CLASSDEF_CAPABLE_FAMILIES → promptIsThemeOnly = false, no badge. */
const FLOWCHART = "flowchart TD\n  A[Start] --> B[End]";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoApply(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.getByRole("tab", { name: "Apply" }).first().click();
  await page.getByLabel("Mermaid diagram code input").waitFor({ state: "visible" });
}

async function pasteDiagram(page: Page, code: string) {
  await page.getByLabel("Mermaid diagram code input").fill(code);
}

/**
 * Click the Download button and wait for the popover to appear.
 * Returns a locator scoped to the dropdown container so callers can find
 * specific row buttons without accidentally matching outside the menu.
 */
async function openDownloadMenu(page: Page) {
  await page.getByRole("button", { name: "Download" }).click();
  // Wait for the popover by checking for the ".mermaid" label span — it is
  // always the first row and renders immediately when showDownloadMenu=true.
  await expect(page.getByText(".mermaid", { exact: true }).first()).toBeVisible({ timeout: 5_000 });
}

/**
 * Returns locators for the .md and .txt download row buttons, scoped to the
 * dropdown popover. Each row button contains a primary label span (".md" /
 * ".txt") and a secondary span with annotations.  We match via the label span
 * to avoid coupling to the full concatenated button text.
 */
function getDownloadRows(page: Page) {
  // The popover is a div with z-40 that holds all the row buttons.
  const popover = page.locator("div.absolute").filter({
    has: page.locator("span", { hasText: /^\.mermaid$/ }),
  });

  const mdRow = popover.locator("button").filter({
    has: page.locator("span", { hasText: /^\.md$/ }),
  });

  const txtRow = popover.locator("button").filter({
    has: page.locator("span", { hasText: /^\.txt$/ }),
  });

  return { popover, mdRow, txtRow };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("'No classDef' badge appears on both .md and .txt rows for a non-classDef diagram", async ({
  page,
}) => {
  await gotoApply(page);
  await pasteDiagram(page, SANKEY);

  // Wait for the detector to recognise the sankey family.
  await expect(
    page
      .locator("button")
      .filter({ hasText: /Sankey/i })
      .first()
  ).toBeVisible({ timeout: 8_000 });

  await openDownloadMenu(page);

  const { mdRow, txtRow } = getDownloadRows(page);

  // Both rows must show the badge.
  await expect(mdRow.getByText("No classDef", { exact: true })).toBeVisible({
    timeout: 5_000,
  });
  await expect(txtRow.getByText("No classDef", { exact: true })).toBeVisible({
    timeout: 5_000,
  });
});

test("'No classDef' badge is absent on .md and .txt rows for a flowchart (classDef-capable)", async ({
  page,
}) => {
  await gotoApply(page);
  await pasteDiagram(page, FLOWCHART);

  // Wait for the detector to recognise flowchart.
  await expect(
    page
      .locator("button")
      .filter({ hasText: /^Flowchart$/ })
      .first()
  ).toBeVisible({ timeout: 8_000 });

  await openDownloadMenu(page);

  const { mdRow, txtRow } = getDownloadRows(page);

  // Neither row should carry the badge.
  await expect(mdRow.getByText("No classDef", { exact: true })).toBeHidden();
  await expect(txtRow.getByText("No classDef", { exact: true })).toBeHidden();
});
