/**
 * Browser coverage for Code preview syntax-highlight colors.
 *
 * This exercises the rendered Code preview rather than only the highlighter's
 * React-node output, ensuring the browser receives readable, distinct colors.
 */

import { test, expect, type Page } from "@playwright/test";

const COMMENT = "%% browser-visible comment";
const CLASSDEF_KEYWORD = "classDef";
const HEX_VALUE = "#0ea5e9";
const HIGHLIGHTED_FLOWCHART = [
  COMMENT,
  "flowchart TD",
  "  A[Start] --> B[End]",
  `classDef browserAccent fill:${HEX_VALUE},stroke:#1e293b`,
].join("\n");

// Computed browser equivalents of COMMENT_HL.text, HL.keyword, and HL.hex.
const COMMENT_COLOR = "rgb(122, 117, 104)";
const CLASSDEF_KEYWORD_COLOR = "rgb(196, 106, 44)";
const HEX_VALUE_COLOR = "rgb(158, 207, 232)";

async function gotoCodePreview(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.clear();
    localStorage.setItem("mtb.firstVisit", "true");
    window.sessionStorage.clear();
  });

  await page.goto("/");
  await page.waitForLoadState("load");
  await page.getByRole("tab", { name: "Apply", exact: true }).click();
  await page.getByLabel("Mermaid diagram code input").fill(HIGHLIGHTED_FLOWCHART);
  await page.getByRole("tab", { name: "code", exact: true }).click();
}

async function colorForExactCodeSpan(page: Page, text: string): Promise<string | null> {
  return page
    .locator('pre[aria-label="Styled code output"] span')
    .evaluateAll((spans, exactText) => {
      const span = spans.find((candidate) => candidate.textContent === exactText);
      return span ? window.getComputedStyle(span).color : null;
    }, text);
}

test("Code preview renders comment, classDef, and hex colors distinctly", async ({ page }) => {
  await gotoCodePreview(page);
  await expect(page.locator('pre[aria-label="Styled code output"]')).toBeVisible();

  const [commentColor, keywordColor, hexColor] = await Promise.all([
    colorForExactCodeSpan(page, COMMENT),
    colorForExactCodeSpan(page, CLASSDEF_KEYWORD),
    colorForExactCodeSpan(page, HEX_VALUE),
  ]);

  expect(commentColor).toBe(COMMENT_COLOR);
  expect(keywordColor).toBe(CLASSDEF_KEYWORD_COLOR);
  expect(hexColor).toBe(HEX_VALUE_COLOR);
  expect(keywordColor).not.toBe(hexColor);
});
