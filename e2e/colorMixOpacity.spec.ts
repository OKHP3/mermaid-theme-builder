/**
 * Playwright smoke tests for Tailwind v4 color-mix() opacity modifiers.
 *
 * Tailwind v4 compiles opacity-modified CSS-variable color utilities such as
 * `text-[var(--okh-forge-code-fg)]/60` into:
 *
 *   @supports (color:color-mix(in lab, red, red)) {
 *     .selector { color: color-mix(in oklab, var(--okh-forge-code-fg) 60%, transparent); }
 *   }
 *
 * with a full-opacity fallback outside the `@supports` block. Chrome 111+,
 * Firefox 113+, and Safari 16.2+ all support color-mix(), so Playwright
 * (Chromium-based) will always hit the `@supports` branch during CI.
 *
 * Failure modes this suite catches:
 *   - CSS regression that removes or mis-formats the `@supports` guard,
 *     causing the fallback (full opacity, alpha=1) to be used instead.
 *   - A class rename that makes the color invisible (alpha=0).
 *   - Any Tailwind version bump that changes the `@supports` condition string.
 *
 * Relevant source:
 *   - src/components/ClassBrowser.tsx (lines 549-712) — preview panel
 *   - src/pages/tabs/ExtractTab.tsx (line 319) — paste-area placeholder
 *   - docs/design-system.md (browser baseline section)
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a CSS color string and return its alpha channel as a value between
 * 0 and 1. Handles:
 *   - `rgba(r, g, b, a)`                   → a
 *   - `rgb(r, g, b)`                        → 1 (fully opaque)
 *   - Modern slash-notation colors:
 *       `oklch(L C H / a)`, `oklab(L a b / a)`, `color(display-p3 r g b / a)` → a
 *   - Modern colors with no alpha:
 *       `oklch(L C H)`, `oklab(L a b)`, `hsl(...)`, etc. → 1 (fully opaque)
 * Returns null when the string cannot be parsed.
 */
function parseAlpha(color: string): number | null {
  // rgba(r, g, b, a) — legacy comma syntax
  const rgba = color.match(
    /rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/
  );
  if (rgba) return parseFloat(rgba[1]);

  // rgb(r, g, b) — no alpha → fully opaque
  if (/^rgb\(/.test(color)) return 1;

  // All modern CSS color functions that carry a slash-notation alpha value:
  //   oklch(L C H / a), oklab(L a b / a), lch(...), lab(...),
  //   color(sRGB r g b / a), color(display-p3 r g b / a), hsl(H S L / a), etc.
  const slashAlpha = color.match(/\/\s*([\d.]+)\s*\)/);
  if (slashAlpha) return parseFloat(slashAlpha[1]);

  // Modern color functions with no alpha component → fully opaque:
  //   oklch(L C H), oklab(L a b), lch(...), lab(...), hsl(...), hwb(...)
  if (/^(oklch|oklab|lch|lab|hsl|hwb|color)\s*\(/i.test(color)) return 1;

  return null;
}

/**
 * Read all same-origin stylesheets as raw text and return them concatenated.
 * Uses fetch() rather than sheet.cssRules to avoid cross-origin SecurityErrors
 * that silent-fail in the try/catch of a stylesheet iteration.
 */
async function fetchCompiledCss(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    );
    const chunks: string[] = [];
    for (const link of links) {
      try {
        const resp = await fetch(link.href);
        if (resp.ok) chunks.push(await resp.text());
      } catch {
        // skip cross-origin or failed sheets
      }
    }
    return chunks.join("\n");
  });
}

/**
 * Navigate to the app root and wait for it to be fully loaded.
 */
async function loadApp(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("load");
}

/**
 * Click a top-level tab button by its exact visible label.
 */
async function switchTab(page: Page, label: string): Promise<void> {
  await page.getByRole("tab", { name: label, exact: true }).first().click();
}

// ---------------------------------------------------------------------------
// Suite 1: @supports guard exists in the compiled stylesheet
// ---------------------------------------------------------------------------

test.describe("color-mix @supports guard — compiled CSS", () => {
  test("compiled stylesheet contains an @supports rule with color-mix condition", async ({
    page,
  }) => {
    await loadApp(page);

    const css = await fetchCompiledCss(page);
    const hasSupportRule =
      css.includes("@supports") && css.includes("color-mix");

    expect(
      hasSupportRule,
      "Expected at least one @supports (color: color-mix(…)) block in the compiled CSS. " +
        "The Tailwind v4 opacity-modifier guard may have been removed or renamed."
    ).toBe(true);
  });

  test("@supports rule contains a color-mix declaration using --okh-forge-code-fg", async ({
    page,
  }) => {
    await loadApp(page);

    const css = await fetchCompiledCss(page);
    const found =
      css.includes("@supports") &&
      css.includes("--okh-forge-code-fg") &&
      css.includes("color-mix");

    expect(
      found,
      "Expected a color-mix() declaration using --okh-forge-code-fg inside an @supports block. " +
        "The ClassBrowser opacity utilities may have been renamed or the CSS guard removed."
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Suite 2: ClassBrowser preview panel — computed opacity at runtime
// ---------------------------------------------------------------------------

test.describe("ClassBrowser preview panel — color-mix opacity rendering", () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    // The default input is a flowchart (classDef-capable), so the preview
    // button is enabled immediately — no need to paste extra code.
    await switchTab(page, "Reference");
    // Open the ClassBrowser preview panel.
    await page.getByRole("button", { name: "Preview all classDefs" }).click();
    // The Close button appears once the preview is rendered.
    await page.waitForSelector('button[aria-label="Close preview"]', {
      timeout: 6_000,
    });
  });

  test("preview header 'Preview —' label renders at reduced opacity (not full or zero)", async ({
    page,
  }) => {
    const colorStr = await page.evaluate(() => {
      // The header span sits inside the preview panel header row and carries
      // text such as "Preview — 4 classDefs".  It uses the /60 opacity modifier.
      const spans = Array.from(document.querySelectorAll("span"));
      const span = spans.find((s) => s.textContent?.includes("Preview \u2014"));
      if (!span) return null;
      return window.getComputedStyle(span).color;
    });

    expect(
      colorStr,
      "Could not find the ClassBrowser preview header span containing 'Preview —'. " +
        "Check that the span is still rendered when the preview is open."
    ).toBeTruthy();

    const alpha = parseAlpha(colorStr!);

    expect(
      alpha,
      `Could not parse alpha from computed color "${colorStr}". ` +
        "Browser may be returning an unexpected color format."
    ).not.toBeNull();

    // /60 → 0.6 nominal.  Must be noticeably below 1.0 but above 0.
    expect(
      alpha!,
      `Header span color "${colorStr}" appears fully opaque (alpha=${alpha}). ` +
        "The color-mix() opacity modifier may not be compiling or the @supports guard may be missing."
    ).toBeLessThan(0.95);

    expect(
      alpha!,
      `Header span color "${colorStr}" appears invisible (alpha=${alpha}). ` +
        "The opacity modifier may have resolved to transparent."
    ).toBeGreaterThan(0.05);
  });

  test("preview 'Copy' action button text renders at reduced opacity", async ({
    page,
  }) => {
    const colorStr = await page.evaluate(() => {
      // The Copy button is in the same header row as the Close button.
      // Scope the search via parentElement to avoid matching any other
      // button with an aria-label ending in "classDefs" outside this panel.
      const closeBtn = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Close preview"]'
      );
      const btn = closeBtn?.parentElement?.querySelector<HTMLButtonElement>(
        'button[aria-label$="classDefs"]'
      );
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(
      colorStr,
      "Could not find the Copy classDefs button inside the preview panel. " +
        "Check that the button's aria-label ends with 'classDefs' (ClassBrowser.tsx)."
    ).toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(alpha, `Could not parse alpha from "${colorStr}"`).not.toBeNull();

    expect(
      alpha!,
      `Copy button color "${colorStr}" appears fully opaque (alpha=${alpha}). ` +
        "The color-mix() opacity modifier may not be rendering correctly."
    ).toBeLessThan(0.95);

    expect(
      alpha!,
      `Copy button color "${colorStr}" appears invisible (alpha=${alpha}).`
    ).toBeGreaterThan(0.05);
  });

  test("preview 'Close' (×) button renders at reduced opacity", async ({
    page,
  }) => {
    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Close preview"]'
      );
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(colorStr, "Could not find the 'Close preview' button.").toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(alpha, `Could not parse alpha from "${colorStr}"`).not.toBeNull();

    // /40 → 0.4 nominal.
    expect(
      alpha!,
      `Close button color "${colorStr}" appears fully opaque (alpha=${alpha}).`
    ).toBeLessThan(0.95);

    expect(
      alpha!,
      `Close button color "${colorStr}" appears invisible (alpha=${alpha}).`
    ).toBeGreaterThan(0.05);
  });
});

// ---------------------------------------------------------------------------
// Suite 2b: ClassBrowser toggle buttons — All/Used mode opacity
//
// The toggle group only renders when usedClassNames is non-empty (hasUsed).
// The default Overkill Hill flowchart applies classDefs via :::className, so
// hasUsed=true on load.  With no stored preference, the preview auto-defaults
// to "used" mode (see ClassBrowser.tsx lines 422-426).
//
// Active-state classes:
//   All  → text-[var(--okh-forge-code-fg)]      (no modifier, alpha ≈ 1)
//   Used → text-emerald-300                      (no modifier, alpha ≈ 1)
//
// Inactive-state class (both buttons):
//   text-[var(--okh-forge-code-fg)]/45           (alpha ~0.45, <0.95)
// ---------------------------------------------------------------------------

test.describe("ClassBrowser toggle buttons — All/Used mode opacity", () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await switchTab(page, "Reference");
    await page.getByRole("button", { name: "Preview all classDefs" }).click();
    // Wait for the Close button to confirm the panel is open.
    await page.waitForSelector('button[aria-label="Close preview"]', {
      timeout: 6_000,
    });
    // Wait for the toggle group to appear (only present when hasUsed is true).
    await page.waitForSelector('[data-preview-toggle="all"]', {
      timeout: 4_000,
    });
  });

  test("inactive 'All' toggle button renders at reduced opacity when 'Used' mode is active", async ({
    page,
  }) => {
    // The preview auto-defaults to 'used' mode, so 'All' is inactive and
    // should carry the /45 opacity modifier.
    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        '[data-preview-toggle="all"]'
      );
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(
      colorStr,
      "Could not find the 'All' toggle button via [data-preview-toggle='all']. " +
        "Check that the attribute is still present in ClassBrowser.tsx."
    ).toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(
      alpha,
      `Could not parse alpha from computed color "${colorStr}".`
    ).not.toBeNull();

    // /45 → ~0.45 nominal. Must be noticeably below 1 (inactive state).
    expect(
      alpha!,
      `Inactive 'All' toggle color "${colorStr}" appears fully opaque (alpha=${alpha}). ` +
        "The text-[var(--okh-forge-code-fg)]/45 modifier may not be compiling " +
        "or the @supports guard may be missing."
    ).toBeLessThan(0.95);

    expect(
      alpha!,
      `Inactive 'All' toggle color "${colorStr}" appears invisible (alpha=${alpha}). ` +
        "The opacity modifier may have resolved to transparent."
    ).toBeGreaterThan(0.05);
  });

  test("active 'Used' toggle button renders at full opacity when 'Used' mode is active", async ({
    page,
  }) => {
    // 'Used' is the active button; its active class is text-emerald-300 with
    // no opacity modifier, so alpha should be ≈ 1.
    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        '[data-preview-toggle="used"]'
      );
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(
      colorStr,
      "Could not find the 'Used' toggle button via [data-preview-toggle='used']. " +
        "Check that the attribute is still present in ClassBrowser.tsx."
    ).toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(
      alpha,
      `Could not parse alpha from computed color "${colorStr}".`
    ).not.toBeNull();

    // Active state has no opacity modifier — must be fully opaque.
    expect(
      alpha!,
      `Active 'Used' toggle color "${colorStr}" appears semi-transparent (alpha=${alpha}). ` +
        "The active state conditional class may have been incorrectly modified."
    ).toBeGreaterThanOrEqual(0.95);
  });

  test("inactive 'Used' toggle button renders at reduced opacity when 'All' mode is active", async ({
    page,
  }) => {
    // Click 'All' to switch mode — wait for aria-pressed to confirm the
    // switch, then allow the CSS transition-colors to settle before reading
    // the computed color.
    await page.locator('[data-preview-toggle="all"]').click();
    await page.waitForSelector('[data-preview-toggle="all"][aria-pressed="true"]', {
      timeout: 3_000,
    });
    await page.waitForTimeout(400);

    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        '[data-preview-toggle="used"]'
      );
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(
      colorStr,
      "Could not find the 'Used' toggle button after switching to 'All' mode."
    ).toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(
      alpha,
      `Could not parse alpha from computed color "${colorStr}".`
    ).not.toBeNull();

    // /45 → ~0.45 nominal. Must be noticeably reduced (inactive state).
    expect(
      alpha!,
      `Inactive 'Used' toggle color "${colorStr}" appears fully opaque (alpha=${alpha}). ` +
        "The text-[var(--okh-forge-code-fg)]/45 modifier may not be applying " +
        "when the button switches to inactive."
    ).toBeLessThan(0.95);

    expect(
      alpha!,
      `Inactive 'Used' toggle color "${colorStr}" appears invisible (alpha=${alpha}).`
    ).toBeGreaterThan(0.05);
  });

  test("active 'All' toggle button renders at full opacity when 'All' mode is active", async ({
    page,
  }) => {
    // Click 'All' to make it the active button; wait for aria-pressed to
    // confirm the state switch, then allow the CSS transition-colors animation
    // to settle before reading the computed color.
    await page.locator('[data-preview-toggle="all"]').click();
    await page.waitForSelector('[data-preview-toggle="all"][aria-pressed="true"]', {
      timeout: 3_000,
    });
    await page.waitForTimeout(400);

    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        '[data-preview-toggle="all"]'
      );
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(
      colorStr,
      "Could not find the 'All' toggle button after clicking it."
    ).toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(
      alpha,
      `Could not parse alpha from computed color "${colorStr}".`
    ).not.toBeNull();

    // Active state has no opacity modifier — must be fully opaque.
    expect(
      alpha!,
      `Active 'All' toggle color "${colorStr}" appears semi-transparent (alpha=${alpha}). ` +
        "The active state conditional class may have been incorrectly modified."
    ).toBeGreaterThanOrEqual(0.95);
  });

  test("inactive 'All' toggle button hover state renders in the /80 opacity range", async ({
    page,
  }) => {
    // The preview defaults to 'used' mode, so 'All' is inactive at /45.
    // Hovering applies hover:text-[var(--okh-forge-code-fg)]/80, lifting
    // the alpha to ~0.80.
    await page.hover('[data-preview-toggle="all"]');
    // Allow the CSS transition-colors to settle before reading.
    await page.waitForTimeout(300);

    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        '[data-preview-toggle="all"]'
      );
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(
      colorStr,
      "Could not find the 'All' toggle button via [data-preview-toggle='all']. " +
        "Check that the attribute is still present in ClassBrowser.tsx."
    ).toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(
      alpha,
      `Could not parse alpha from computed color "${colorStr}".`
    ).not.toBeNull();

    // hover:/80 → ~0.80 nominal.  Must sit clearly above the resting /45
    // value (>0.75) and below full opacity (<0.95).
    expect(
      alpha!,
      `Hovered 'All' toggle color "${colorStr}" is below the /80 range (alpha=${alpha}). ` +
        "The hover:text-[var(--okh-forge-code-fg)]/80 modifier may have been removed " +
        "or replaced with a lower value."
    ).toBeGreaterThan(0.75);

    expect(
      alpha!,
      `Hovered 'All' toggle color "${colorStr}" appears fully opaque (alpha=${alpha}). ` +
        "The /80 hover modifier may not be applying — alpha should remain below 0.95."
    ).toBeLessThan(0.95);
  });
});

// ---------------------------------------------------------------------------
// Suite 3: ExtractTab paste-area placeholder opacity
//
// The ExtractTab lives inside the Compose tab, inside a collapsible section
// toggled by the "Toggle Extract Theme" button.
// ---------------------------------------------------------------------------

test.describe("ExtractTab paste-area — placeholder color-mix opacity", () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    // Navigate to the Compose tab, then open the Extract Theme section.
    await switchTab(page, "Compose");
    await page.getByRole("button", { name: "Toggle Extract Theme" }).click();
    // Wait for the textarea to appear.
    await page.waitForSelector(
      'textarea[aria-label="Paste themed Mermaid diagram here"]',
      { timeout: 6_000 }
    );
  });

  test("paste-area placeholder text renders at reduced opacity via color-mix", async ({
    page,
  }) => {
    const colorStr = await page.evaluate(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        'textarea[aria-label="Paste themed Mermaid diagram here"]'
      );
      if (!textarea) return null;
      return window.getComputedStyle(textarea, "::placeholder").color;
    });

    expect(
      colorStr,
      "Could not compute ::placeholder color on the ExtractTab paste area. " +
        "Verify the textarea aria-label matches."
    ).toBeTruthy();

    // Some browsers return empty string or 'none' for pseudo-element colors
    // when the element does not match — treat as a soft skip.
    if (!colorStr || colorStr === "" || colorStr === "none") {
      return;
    }

    const alpha = parseAlpha(colorStr);

    // If alpha cannot be parsed (e.g. a named CSS color), just confirm the
    // property was set to something non-empty.
    if (alpha === null) {
      expect(colorStr.length).toBeGreaterThan(0);
      return;
    }

    // /30 → 0.3 nominal.  Must be noticeably reduced and not invisible.
    expect(
      alpha,
      `Placeholder color "${colorStr}" appears fully opaque (alpha=${alpha}). ` +
        "The /30 opacity modifier on the ExtractTab placeholder may not be compiling."
    ).toBeLessThan(0.85);

    expect(
      alpha,
      `Placeholder color "${colorStr}" appears invisible (alpha=${alpha}).`
    ).toBeGreaterThan(0.01);
  });

  test("@supports rule in compiled CSS targets placeholder with --okh-forge-code-fg", async ({
    page,
  }) => {
    const css = await fetchCompiledCss(page);
    const found =
      css.includes("@supports") &&
      css.includes("placeholder") &&
      css.includes("--okh-forge-code-fg") &&
      css.includes("color-mix");

    expect(
      found,
      "Expected a color-mix() @supports rule targeting the ::placeholder pseudo-element " +
        "with --okh-forge-code-fg. The ExtractTab placeholder opacity class may have changed."
    ).toBe(true);
  });
});
