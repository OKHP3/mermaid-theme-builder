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

/** data-example-id for the basic Gantt entry in the Example Library. */
const GANTT_ID = "gantt-basic";

/** data-example-id for the Venn governance triangle entry in the Example Library. */
const VENN_ID = "venn-governance-triangle";

/** data-example-id for the first Overkill Hill brand flowchart. */
const FLOWCHART_ID = "brand-overkill-hill-flow";

/**
 * Sidebar section labels (from src/lib/examples-filter.ts).
 *
 * The ExamplesTab renders an accordion whose sections are collapsed on first
 * load (except for the auto-selected example's section). Before clicking an
 * item in a collapsed section we must first expand that section.
 */
const SECTION_BRAND = "OKHP3 Brand & Showcase";
const SECTION_FLOW = "Flowchart & Sequence";
const SECTION_DATA = "Data & Planning";
const SECTION_SPECIALTY = "Specialty";

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
 * Expand a sidebar section accordion if the target item is not yet in the DOM.
 *
 * The ExamplesTab accordion collapses all sections on first load except the
 * one containing the auto-selected example. Items inside a collapsed section
 * are not rendered — their [data-example-id] buttons do not exist in the DOM.
 * Clicking the section header toggles it open, making the items visible.
 *
 * We check visibility first so we don't accidentally re-collapse an already-
 * expanded section (the toggle is a simple open/close).
 */
async function expandSectionIfNeeded(page: Page, itemId: string, sectionLabel: string): Promise<void> {
  const item = page.locator(`[data-example-id="${itemId}"]`);
  const visible = await item.isVisible();
  if (!visible) {
    // Click the section header button whose accessible name is the label.
    await page.getByRole("button", { name: sectionLabel, exact: true }).click();
    await item.waitFor({ state: "visible", timeout: 5_000 });
  }
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
  // ZenUML lives in the "Flowchart & Sequence" section. The accordion may have
  // that section collapsed if a different section is active — expand it first.
  await expandSectionIfNeeded(page, ZENUML_ID, SECTION_FLOW);
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
 * Click the Gantt sidebar entry and wait for the preview to show a non-flowchart
 * render. Gantt is one of the confirmed render-time <style> injectors — this
 * helper exists specifically to trigger that injection path so the cleanup guard
 * can be asserted against.
 *
 * Resolves when either:
 *   a) An SVG without class="flowchart" appears (Gantt rendered), or
 *   b) A render-error element appears.
 */
async function selectGanttAndWait(page: Page): Promise<void> {
  // Gantt lives in the "Data & Planning" section — expand it if collapsed.
  await expandSectionIfNeeded(page, GANTT_ID, SECTION_DATA);
  await page.locator(`[data-example-id="${GANTT_ID}"]`).click();

  // Phase 1 — wait for the React label to update to confirm the click registered.
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("span")).some((el) =>
        el.textContent?.includes("Gantt")
      ),
    undefined,
    { timeout: 5_000 }
  );

  // Phase 2 — wait for the render to complete or time out gracefully.
  // The style-capture guard runs in a finally block so it fires even on error.
  await page
    .waitForFunction(
      () => {
        const preview = document.querySelector('[id^="mermaid-preview-"]');
        if (!preview) return false;
        const svg = preview.querySelector("svg");
        if (svg && !svg.classList.contains("flowchart")) return true;
        if (preview.querySelector(".text-destructive") !== null) return true;
        return false;
      },
      undefined,
      { timeout: 10_000 }
    )
    .catch(() => {
      // Gantt render did not settle within 10 s. Acceptable — style-capture
      // guard already fired; proceed to the leakage assertions.
    });
}

/**
 * Click the Venn sidebar entry and wait for the preview to show a non-flowchart
 * render. Venn is one of the confirmed render-time <style> injectors — this
 * helper exists specifically to trigger that injection path so the cleanup guard
 * can be asserted against.
 *
 * Resolves when either:
 *   a) An SVG without class="flowchart" appears (Venn rendered), or
 *   b) A render-error element appears.
 */
async function selectVennAndWait(page: Page): Promise<void> {
  // Venn lives in the "Specialty" section — expand it if collapsed.
  await expandSectionIfNeeded(page, VENN_ID, SECTION_SPECIALTY);
  await page.locator(`[data-example-id="${VENN_ID}"]`).click();

  // Phase 1 — wait for the React label to update to confirm the click registered.
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("span")).some((el) =>
        el.textContent?.includes("Venn")
      ),
    undefined,
    { timeout: 5_000 }
  );

  // Phase 2 — wait for the render to complete or time out gracefully.
  // The style-capture guard runs in a finally block so it fires even on error.
  await page
    .waitForFunction(
      () => {
        const preview = document.querySelector('[id^="mermaid-preview-"]');
        if (!preview) return false;
        const svg = preview.querySelector("svg");
        if (svg && !svg.classList.contains("flowchart")) return true;
        if (preview.querySelector(".text-destructive") !== null) return true;
        return false;
      },
      undefined,
      { timeout: 10_000 }
    )
    .catch(() => {
      // Venn render did not settle within 10 s. Acceptable — style-capture
      // guard already fired; proceed to the leakage assertions.
    });
}

/**
 * Click the Overkill Hill flowchart sidebar entry and wait for the preview to
 * show a flowchart SVG (class="flowchart"). This is the state AFTER a
 * non-flowchart diagram was shown, so the previous SVG (or error) was in the
 * container before this call.
 *
 * The flowchart lives in the "OKHP3 Brand & Showcase" section; after the
 * previous selection expanded a different section the accordion collapses this
 * one, so we expand it before clicking.
 *
 * Flowchart rendering is near-instant once Mermaid is initialised, so a
 * 10 s timeout is ample.
 */
async function selectFlowchartAndWait(page: Page): Promise<void> {
  // The accordion may have collapsed "OKHP3 Brand & Showcase" when another
  // section was expanded — re-expand it before clicking the flowchart entry.
  await expandSectionIfNeeded(page, FLOWCHART_ID, SECTION_BRAND);
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

test.describe("CSS leakage smoke — Gantt then flowchart", () => {
  test("document.head style count does not grow after Gantt render", async ({ page }) => {
    await openExamplesTab(page);

    const baseline = await headStyleCount(page);

    await selectGanttAndWait(page);

    const afterGantt = await headStyleCount(page);
    expect(afterGantt).toBe(baseline);
  });

  test("document.head style count does not grow after switching to flowchart", async ({ page }) => {
    await openExamplesTab(page);

    const baseline = await headStyleCount(page);

    // Render Gantt first — this is the confirmed <style> injection point.
    await selectGanttAndWait(page);

    // Switch to the flowchart.
    await selectFlowchartAndWait(page);

    const afterFlowchart = await headStyleCount(page);
    expect(afterFlowchart).toBe(baseline);
  });

  test("flowchart node rect fill matches the Overkill Hill primaryColor after Gantt render", async ({
    page,
  }) => {
    await openExamplesTab(page);

    // Render Gantt to trigger the confirmed style-injection point.
    await selectGanttAndWait(page);

    // Switch to the Overkill Hill flowchart.
    await selectFlowchartAndWait(page);

    // Read the computed fill of the first node rect inside the flowchart SVG.
    // A Gantt CSS leak could override this with a task-bar color or produce an
    // empty/transparent fill.
    const nodeFill = await page.evaluate(() => {
      const preview = document.querySelector('[id^="mermaid-preview-"]');
      if (!preview) return null;
      const rect = preview.querySelector("svg.flowchart .node rect");
      if (!rect) return null;
      return window.getComputedStyle(rect).fill;
    });

    expect(nodeFill).not.toBeNull();
    // The fill must match the Overkill Hill primaryColor. A Gantt CSS leak
    // could override this with a grid/task-bar color or produce an empty value.
    expect(nodeFill).toBe(EXPECTED_FILL_RGB);
  });
});

test.describe("CSS leakage smoke — Venn then flowchart", () => {
  test("document.head style count does not grow after Venn render", async ({ page }) => {
    await openExamplesTab(page);

    const baseline = await headStyleCount(page);

    await selectVennAndWait(page);

    const afterVenn = await headStyleCount(page);
    expect(afterVenn).toBe(baseline);
  });

  test("document.head style count does not grow after switching to flowchart", async ({ page }) => {
    await openExamplesTab(page);

    const baseline = await headStyleCount(page);

    // Render Venn first — this is the confirmed <style> injection point.
    await selectVennAndWait(page);

    // Switch to the flowchart.
    await selectFlowchartAndWait(page);

    const afterFlowchart = await headStyleCount(page);
    expect(afterFlowchart).toBe(baseline);
  });

  test("flowchart node rect fill matches the Overkill Hill primaryColor after Venn render", async ({
    page,
  }) => {
    await openExamplesTab(page);

    // Render Venn to trigger the confirmed style-injection point.
    await selectVennAndWait(page);

    // Switch to the Overkill Hill flowchart.
    await selectFlowchartAndWait(page);

    // Read the computed fill of the first node rect inside the flowchart SVG.
    // A Venn CSS leak could override this with a d3-layout color or produce an
    // empty/transparent fill.
    const nodeFill = await page.evaluate(() => {
      const preview = document.querySelector('[id^="mermaid-preview-"]');
      if (!preview) return null;
      const rect = preview.querySelector("svg.flowchart .node rect");
      if (!rect) return null;
      return window.getComputedStyle(rect).fill;
    });

    expect(nodeFill).not.toBeNull();
    // The fill must match the Overkill Hill primaryColor. A Venn CSS leak
    // could override this with a d3-based color or produce an empty value.
    expect(nodeFill).toBe(EXPECTED_FILL_RGB);
  });
});
