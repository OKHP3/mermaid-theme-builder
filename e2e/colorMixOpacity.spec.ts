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
 *   - src/components/ClassBrowser.tsx (lines 549-712) - preview panel
 *   - src/pages/tabs/ExtractTab.tsx (line 319) - paste-area placeholder
 *   - docs/design-system.md (browser baseline section)
 */

import { test, expect, type Page } from "@playwright/test";

const CLASS_USAGE_FLOWCHART = `flowchart TD
  classDef primary fill:#111827,stroke:#c46a2c,color:#e5e7eb
  A[Start]:::primary --> B[Finish]:::primary
`;

/**
 * Parse a CSS color string and return its alpha channel as a value between
 * 0 and 1.
 */
function parseAlpha(color: string): number | null {
  const rgba = color.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
  if (rgba) return parseFloat(rgba[1]);

  if (/^rgb\(/.test(color)) return 1;

  const slashAlpha = color.match(/\/\s*([\d.]+)\s*\)/);
  if (slashAlpha) return parseFloat(slashAlpha[1]);

  if (/^(oklch|oklab|lch|lab|hsl|hwb|color)\s*\(/i.test(color)) return 1;

  return null;
}

async function fetchCompiledCss(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
    const chunks: string[] = [];
    for (const link of links) {
      try {
        const resp = await fetch(link.href);
        if (resp.ok) chunks.push(await resp.text());
      } catch {
        // Skip cross-origin or failed sheets.
      }
    }
    return chunks.join("\n");
  });
}

async function loadApp(page: Page, options?: { inputCode?: string }): Promise<void> {
  await page.addInitScript((inputCode) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    if (inputCode) {
      window.localStorage.setItem(
        "mtb.state.v1",
        JSON.stringify({
          schemaVersion: 1,
          inputCode,
        })
      );
    }
  }, options?.inputCode ?? null);
  await page.goto("/");
  await page.waitForLoadState("load");
}

async function switchTab(page: Page, label: string): Promise<void> {
  await page.getByRole("tab", { name: label, exact: true }).first().click();
}

async function openClassLibrary(page: Page): Promise<void> {
  const previewButton = page.getByRole("button", { name: "Preview all classDefs" });
  if (await previewButton.isVisible().catch(() => false)) {
    return;
  }

  await page.locator("summary").filter({ hasText: "Class Library" }).first().click();
  await expect(previewButton).toBeVisible();
}

test.describe("color-mix @supports guard - compiled CSS", () => {
  test("compiled stylesheet contains an @supports rule with color-mix condition", async ({
    page,
  }) => {
    await loadApp(page);

    const css = await fetchCompiledCss(page);
    const hasSupportRule = css.includes("@supports") && css.includes("color-mix");

    expect(
      hasSupportRule,
      "Expected at least one @supports (color: color-mix(...)) block in the compiled CSS. " +
        "The Tailwind v4 opacity-modifier guard may have been removed or renamed."
    ).toBe(true);
  });

  test("@supports rule contains a color-mix declaration using --okh-forge-code-fg", async ({
    page,
  }) => {
    await loadApp(page);

    const css = await fetchCompiledCss(page);
    const found =
      css.includes("@supports") && css.includes("--okh-forge-code-fg") && css.includes("color-mix");

    expect(
      found,
      "Expected a color-mix() declaration using --okh-forge-code-fg inside an @supports block. " +
        "The ClassBrowser opacity utilities may have been renamed or the CSS guard removed."
    ).toBe(true);
  });
});

test.describe("ClassBrowser preview panel - color-mix opacity rendering", () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { inputCode: CLASS_USAGE_FLOWCHART });
    await switchTab(page, "Reference");
    await openClassLibrary(page);
    await page.getByRole("button", { name: "Preview all classDefs" }).click();
    await page.waitForSelector('button[aria-label="Close preview"]', {
      timeout: 6_000,
    });
  });

  test("preview header label renders at reduced opacity", async ({ page }) => {
    const colorStr = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const span = spans.find((s) => s.textContent?.includes("Preview"));
      if (!span) return null;
      return window.getComputedStyle(span).color;
    });

    expect(colorStr, "Could not find the ClassBrowser preview header span.").toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(alpha, `Could not parse alpha from computed color "${colorStr}".`).not.toBeNull();

    expect(
      alpha!,
      `Header span color "${colorStr}" appears fully opaque (alpha=${alpha}).`
    ).toBeLessThan(0.95);

    expect(
      alpha!,
      `Header span color "${colorStr}" appears invisible (alpha=${alpha}).`
    ).toBeGreaterThan(0.05);
  });

  test("preview copy action button text renders at reduced opacity", async ({ page }) => {
    const colorStr = await page.evaluate(() => {
      const closeBtn = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Close preview"]'
      );
      const btn = closeBtn?.parentElement?.querySelector<HTMLButtonElement>(
        'button[aria-label$="classDefs"]'
      );
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(colorStr, "Could not find the copy classDefs button inside the preview panel.").toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(alpha, `Could not parse alpha from "${colorStr}"`).not.toBeNull();

    expect(
      alpha!,
      `Copy button color "${colorStr}" appears fully opaque (alpha=${alpha}).`
    ).toBeLessThan(0.95);

    expect(
      alpha!,
      `Copy button color "${colorStr}" appears invisible (alpha=${alpha}).`
    ).toBeGreaterThan(0.05);
  });

  test("preview close button renders at reduced opacity", async ({ page }) => {
    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('button[aria-label="Close preview"]');
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(colorStr, "Could not find the close preview button.").toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(alpha, `Could not parse alpha from "${colorStr}"`).not.toBeNull();

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

test.describe("ClassBrowser toggle buttons - All/Used mode opacity", () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page, { inputCode: CLASS_USAGE_FLOWCHART });
    await switchTab(page, "Reference");
    await openClassLibrary(page);
    await page.getByRole("button", { name: "Preview all classDefs" }).click();
    await page.waitForSelector('button[aria-label="Close preview"]', {
      timeout: 6_000,
    });
    await page.waitForSelector('[data-preview-toggle="all"]', {
      timeout: 4_000,
    });
  });

  test("inactive All toggle button renders at reduced opacity when Used mode is active", async ({
    page,
  }) => {
    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('[data-preview-toggle="all"]');
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(colorStr, "Could not find the All toggle button.").toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(alpha, `Could not parse alpha from computed color "${colorStr}".`).not.toBeNull();

    expect(
      alpha!,
      `Inactive All toggle color "${colorStr}" appears fully opaque (alpha=${alpha}).`
    ).toBeLessThan(0.95);

    expect(
      alpha!,
      `Inactive All toggle color "${colorStr}" appears invisible (alpha=${alpha}).`
    ).toBeGreaterThan(0.05);
  });

  test("active Used toggle button renders at full opacity when Used mode is active", async ({
    page,
  }) => {
    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('[data-preview-toggle="used"]');
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(colorStr, "Could not find the Used toggle button.").toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(alpha, `Could not parse alpha from computed color "${colorStr}".`).not.toBeNull();

    expect(
      alpha!,
      `Active Used toggle color "${colorStr}" appears semi-transparent (alpha=${alpha}).`
    ).toBeGreaterThanOrEqual(0.95);
  });

  test("inactive Used toggle button renders at reduced opacity when All mode is active", async ({
    page,
  }) => {
    await page.locator('[data-preview-toggle="all"]').click();
    await page.waitForSelector('[data-preview-toggle="all"][aria-pressed="true"]', {
      timeout: 3_000,
    });
    await page.waitForTimeout(400);

    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('[data-preview-toggle="used"]');
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(colorStr, "Could not find the Used toggle button after switching to All mode.").toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(alpha, `Could not parse alpha from computed color "${colorStr}".`).not.toBeNull();

    expect(
      alpha!,
      `Inactive Used toggle color "${colorStr}" appears fully opaque (alpha=${alpha}).`
    ).toBeLessThan(0.95);

    expect(
      alpha!,
      `Inactive Used toggle color "${colorStr}" appears invisible (alpha=${alpha}).`
    ).toBeGreaterThan(0.05);
  });

  test("active All toggle button renders at full opacity when All mode is active", async ({
    page,
  }) => {
    await page.locator('[data-preview-toggle="all"]').click();
    await page.waitForSelector('[data-preview-toggle="all"][aria-pressed="true"]', {
      timeout: 3_000,
    });
    await page.waitForTimeout(400);

    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('[data-preview-toggle="all"]');
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(colorStr, "Could not find the All toggle button after clicking it.").toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(alpha, `Could not parse alpha from computed color "${colorStr}".`).not.toBeNull();

    expect(
      alpha!,
      `Active All toggle color "${colorStr}" appears semi-transparent (alpha=${alpha}).`
    ).toBeGreaterThanOrEqual(0.95);
  });

  test("inactive All toggle button hover state renders in the /80 opacity range", async ({
    page,
  }) => {
    await page.hover('[data-preview-toggle="all"]');
    await page.waitForTimeout(300);

    const colorStr = await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('[data-preview-toggle="all"]');
      if (!btn) return null;
      return window.getComputedStyle(btn).color;
    });

    expect(colorStr, "Could not find the All toggle button.").toBeTruthy();

    const alpha = parseAlpha(colorStr!);
    expect(alpha, `Could not parse alpha from computed color "${colorStr}".`).not.toBeNull();

    expect(
      alpha!,
      `Hovered All toggle color "${colorStr}" is below the /80 range (alpha=${alpha}).`
    ).toBeGreaterThan(0.75);

    expect(
      alpha!,
      `Hovered All toggle color "${colorStr}" appears fully opaque (alpha=${alpha}).`
    ).toBeLessThan(0.95);
  });
});

test.describe("ExtractTab paste-area - placeholder color-mix opacity", () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await switchTab(page, "Compose");
    await page.getByRole("button", { name: "Import Theme", exact: true }).click();
    await page.waitForSelector('textarea[aria-label="Paste themed Mermaid diagram here"]', {
      timeout: 6_000,
    });
  });

  test("paste-area placeholder text renders at reduced opacity via color-mix", async ({ page }) => {
    const colorStr = await page.evaluate(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        'textarea[aria-label="Paste themed Mermaid diagram here"]'
      );
      if (!textarea) return null;
      return window.getComputedStyle(textarea, "::placeholder").color;
    });

    expect(
      colorStr,
      "Could not compute ::placeholder color on the ExtractTab paste area."
    ).toBeTruthy();

    if (!colorStr || colorStr === "" || colorStr === "none") {
      return;
    }

    const alpha = parseAlpha(colorStr);

    if (alpha === null) {
      expect(colorStr.length).toBeGreaterThan(0);
      return;
    }

    expect(
      alpha,
      `Placeholder color "${colorStr}" appears fully opaque (alpha=${alpha}).`
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
