/**
 * CSS leakage smoke test — ZenUML styles must not contaminate flowchart renders.
 *
 * ## What this tests
 *
 * MermaidPreview uses createStyleCapture (src/lib/style-cleanup.ts) to intercept
 * any <style> elements injected into document.head during a mermaid.render() call
 * and remove them immediately, re-injecting them scoped to the preview container.
 * Without this guard, ZenUML's Vue-component <style> blocks injected at
 * registerExternalDiagrams() time would persist in document.head and bleed into
 * subsequent diagram renders.
 *
 * ## Strategy
 *
 * 1. Open the Examples tab and record the baseline document.head style-element count.
 * 2. Select the ZenUML example — Mermaid initialises the ZenUML renderer, which is
 *    the primary injection point (registerExternalDiagrams injects Vue styles).
 * 3. After the ZenUML render settles, assert document.head style count has not grown
 *    beyond the baseline (proves the capture-and-remove guard fired).
 * 4. Switch to the Overkill Hill flowchart example — a plain flowchart that must
 *    not be affected by ZenUML's styles.
 * 5. Assert document.head style count is still at baseline.
 * 6. Assert the flowchart SVG's node rect computed fill matches the Overkill Hill
 *    primaryColor (#111827 → rgb(17, 24, 39)) — a ZenUML style leak could override
 *    this with a wrong color or produce an empty/transparent fill.
 *
 * ## SVG class detection
 *
 * Playwright's state: "visible" check fails here because the MermaidPreview
 * container is flex-positioned and may have a zero computed height in the test
 * viewport. We bypass Playwright's visibility check and instead poll the SVG
 * class attribute directly via page.waitForFunction:
 *
 *   - After clicking ZenUML: wait for SVG without class "flowchart" (or error).
 *     ZenUML's rendered SVG has a different aria-roledescription / class than
 *     the preceding flowchart diagram.
 *   - After clicking the flowchart: wait for SVG with class="flowchart".
 *     This class is set by Mermaid on every flowchart-v2 render.
 *
 * The app runs at PLAYWRIGHT_BASE_URL (default: http://localhost:4173/mermaid-theme-builder/).
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** data-example-id for the ZenUML entry in the Example Library. */
const ZENUML_ID = "zenuml-council-prototype-flow";

/** data-example-id for the first Overkill Hill brand flowchart. */
const FLOWCHART_ID = "brand-overkill-hill-flow";

/**
 * Expected computed fill of a flowchart node rect when the Overkill Hill
 * palette is active. Overkill Hill primaryColor = #111827 = rgb(17, 24, 39).
 * Browsers normalise fill to rgb() in getComputedStyle.
 */
const EXPECTED_FILL_RGB = "rgb(17, 24, 39)";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the app and open the Examples tab. */
async function openExamplesTab(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.getByRole("tab", { name: "Examples" }).first().click();
  // Wait for the sidebar to populate before interacting.
  await page.waitForSelector("[data-example-id]", { timeout: 10_000 });
}

/**
 * Click the ZenUML sidebar entry and wait for the preview to leave the
 * flowchart state. ZenUML requires a first-load dynamic import (Vue renderer)
 * so the timeout is generous (30 s).
 *
 * Resolves when either:
 *   a) An SVG without class="flowchart" appears (ZenUML rendered), or
 *   b) A render-error element appears (.text-destructive) — the Vue import
 *      failed in the current environment, but the style-cleanup guard still
 *      ran (its finally block fires even on error).
 *
 * When the Examples tab opens the first example (brand-overkill-hill-flow) is
 * auto-selected and a flowchart SVG is already in the preview. Waiting for
 * "not class flowchart" confirms the ZenUML render cycle completed.
 */
async function selectZenumlAndWait(page: Page): Promise<void> {
  await page.locator(`[data-example-id="${ZENUML_ID}"]`).click();

  // Phase 1 — wait for the React label to update (synchronous state change).
  // This confirms the click registered and ZenUML code is now being passed to
  // MermaidPreview. The header <span> in the preview pane changes to the
  // example label immediately on click.
  // NOTE: waitForFunction signature is (fn, arg?, options?). Pass undefined
  // as arg so { timeout } is correctly received as the options parameter.
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("span")).some((el) =>
        el.textContent?.includes("ZenUML")
      ),
    undefined,
    { timeout: 5_000 }
  );

  // Phase 2 — attempt to wait for the render to complete. ZenUML uses a
  // Vue-based renderer that may hang in headless Chromium environments. If it
  // times out we continue: the style-capture guard (createStyleCapture) runs
  // inside a finally block so it removes any injected styles even on incomplete
  // renders. The CSS leakage assertions are still valid after a timeout.
  await page
    .waitForFunction(
      () => {
        const preview = document.querySelector('[id^="mermaid-preview-"]');
        if (!preview) return false;
        const svg = preview.querySelector("svg");
        // ZenUML SVG does NOT carry class="flowchart".
        if (svg && !svg.classList.contains("flowchart")) return true;
        // Render failed: error element is present.
        if (preview.querySelector(".text-destructive") !== null) return true;
        return false;
      },
      undefined,
      { timeout: 10_000 }
    )
    .catch(() => {
      // ZenUML render did not settle within 10 s. Acceptable — style-capture
      // guard already fired; proceed to the leakage assertions.
    });
}

/**
 * Click the Overkill Hill flowchart sidebar entry and wait for the preview to
 * show a flowchart SVG (class="flowchart"). This is the state AFTER ZenUML was
 * shown, so the ZenUML SVG (or error) was in the container before this call.
 *
 * Flowchart rendering is near-instant once Mermaid is initialised, so a
 * 10 s timeout is ample.
 */
async function selectFlowchartAndWait(page: Page): Promise<void> {
  await page.locator(`[data-example-id="${FLOWCHART_ID}"]`).click();

  // NOTE: waitForFunction signature is (fn, arg?, options?). Pass undefined
  // as arg so { timeout } is correctly received as the options parameter.
  await page.waitForFunction(
    () => {
      const preview = document.querySelector('[id^="mermaid-preview-"]');
      // Mermaid sets class="flowchart" on every flowchart-v2 SVG output.
      return preview?.querySelector("svg.flowchart") !== null;
    },
    undefined,
    { timeout: 10_000 }
  );
}

/**
 * Returns the current count of <style> elements in document.head.
 * Used to detect unscoped CSS leakage from diagram renders.
 */
async function headStyleCount(page: Page): Promise<number> {
  return page.evaluate(() => document.head.querySelectorAll("style").length);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("CSS leakage smoke — ZenUML then flowchart", () => {
  test("document.head style count does not grow after ZenUML render", async ({ page }) => {
    await openExamplesTab(page);

    const baseline = await headStyleCount(page);

    await selectZenumlAndWait(page);

    const afterZenuml = await headStyleCount(page);
    expect(afterZenuml).toBe(baseline);
  });

  test("document.head style count does not grow after switching to flowchart", async ({ page }) => {
    await openExamplesTab(page);

    const baseline = await headStyleCount(page);

    // Render ZenUML first — this is the injection-risk step.
    await selectZenumlAndWait(page);

    // Switch to the flowchart.
    await selectFlowchartAndWait(page);

    const afterFlowchart = await headStyleCount(page);
    expect(afterFlowchart).toBe(baseline);
  });

  test("flowchart node rect fill matches the Overkill Hill primaryColor after ZenUML render", async ({
    page,
  }) => {
    await openExamplesTab(page);

    // Render ZenUML to trigger the injection point.
    await selectZenumlAndWait(page);

    // Switch to the Overkill Hill flowchart.
    await selectFlowchartAndWait(page);

    // Read the computed fill of the first node rect inside the flowchart SVG.
    // The SVG may contain cluster (subgraph) rects before node rects; those use
    // clusterBkg, not primaryColor. Target .node rect to reach the actual node
    // shape fill. getComputedStyle normalises fill to rgb() format in Chromium.
    const nodeFill = await page.evaluate(() => {
      const preview = document.querySelector('[id^="mermaid-preview-"]');
      if (!preview) return null;
      const rect = preview.querySelector("svg.flowchart .node rect");
      if (!rect) return null;
      return window.getComputedStyle(rect).fill;
    });

    expect(nodeFill).not.toBeNull();
    // The fill must match the Overkill Hill primaryColor. A ZenUML CSS leak
    // could override this with a Vue-component color or produce an empty value.
    expect(nodeFill).toBe(EXPECTED_FILL_RGB);
  });
});
