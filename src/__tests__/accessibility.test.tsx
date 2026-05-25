// @vitest-environment happy-dom

/**
 * Automated accessibility checks using axe-core (Task #93).
 *
 * Scans real rendered components for WCAG violations:
 *   1. AppShell — full main app shell (tab bar, header, footer, apply tab)
 *   2. ApplyTab — the most interactive surface rendered with realistic props
 *   3. ColorSwatch — hex color variant
 *   4. ColorSwatch — font-family variant
 *   5. ColorSwatch — overridden/reset variant
 *
 * Only critical and serious violations fail the suite.
 * Minor/moderate issues are logged but do not block CI.
 *
 * mermaid is mocked to prevent async SVG rendering from interfering with
 * the synchronous axe scan; the ARIA structure is fully present even
 * when the diagram hasn't rendered yet.
 */

// vi.mock is hoisted by vitest — must appear before any imports.
import { vi, describe, it, expect, afterEach, beforeAll } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

import { render, cleanup } from "@testing-library/react";
import { createElement } from "react";
import axe from "axe-core";

import { AppShell } from "@/App";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { ExtractTab } from "@/pages/tabs/ExtractTab";
import { ColorSwatch } from "@/components/ColorSwatch";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";

// ---------------------------------------------------------------------------
// Suppress happy-dom navigation warnings that appear when AppShell writes to
// window.location.hash inside a useEffect. These are benign in tests.
// ---------------------------------------------------------------------------
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    if (msg.includes("navigation") || msg.includes("Not implemented")) return;
    // Let other errors through so real issues are visible.
    console.warn("[test error]", ...args);
  });
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run axe on a container and split into blocking (critical/serious) vs all. */
async function runAxe(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
    },
  });
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  return { all: results.violations, blocking };
}

function logViolations(label: string, violations: axe.Result[]) {
  if (violations.length > 0) {
    console.info(
      `[a11y] ${label} violations:`,
      violations.map((v) => `${v.impact}: ${v.id} — ${v.description}`),
    );
  }
}

// ---------------------------------------------------------------------------
// 1. AppShell — real main app shell
//
// Renders the full AppShell (header, desktop tab bar, main content with
// ApplyTab, mobile nav, footer). ApplyTab is always mounted in AppShell so
// this single render exercises both surfaces simultaneously.
// ---------------------------------------------------------------------------
describe("AppShell (real component)", () => {
  it("has zero critical/serious axe violations on initial render", async () => {
    const { container } = render(createElement(AppShell, null));
    const { blocking, all } = await runAxe(container);
    logViolations("AppShell", all);
    expect(
      blocking,
      `Critical/serious violations:\n${blocking
        .map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.map((n) => n.html).slice(0, 2).join(", ")}`)
        .join("\n")}`,
    ).toHaveLength(0);
  });

  it("has a skip-to-main-content link as the first focusable element", () => {
    const { container } = render(createElement(AppShell, null));
    const skipLink = container.querySelector<HTMLAnchorElement>('a[href="#main-content"]');
    expect(skipLink, "skip link <a href='#main-content'> must exist").toBeTruthy();
    expect(skipLink?.textContent?.trim()).toBe("Skip to main content");
  });

  it("has a main element with id='main-content' for the skip link target", () => {
    const { container } = render(createElement(AppShell, null));
    const main = container.querySelector("#main-content");
    expect(main, "element with id='main-content' must exist").toBeTruthy();
    expect(main?.tagName.toLowerCase()).toBe("main");
  });

  it("skip link precedes the header in DOM order", () => {
    const { container } = render(createElement(AppShell, null));
    const skipLink = container.querySelector('a[href="#main-content"]');
    const header = container.querySelector("header");
    expect(skipLink).toBeTruthy();
    expect(header).toBeTruthy();
    const position = skipLink!.compareDocumentPosition(header!);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 2. ApplyTab — most interactive surface, rendered with realistic props
//
// Uses BRAND_PALETTES[0] as the active palette and a simple flowchart
// diagram as the input code. All event handlers are vi.fn() stubs.
// ---------------------------------------------------------------------------
describe("ApplyTab (real component)", () => {
  const palette = BRAND_PALETTES[0];
  const noop = vi.fn();

  const applyTabProps = {
    selectedPalette: palette,
    selectedPaletteId: palette.id,
    onSelectPalette: noop,
    customColors: {},
    onColorChange: noop,
    onResetPalette: noop,
    onResetColor: noop,
    hasCustomizations: false,
    inputCode: "flowchart TD\n  A[Start] --> B[End]",
    onInputChange: noop,
    includeMetaComments: true,
    includeBadge: true,
    effectiveThemeName: palette.name,
    onSwitchTab: noop,
    onExtractTheme: vi.fn().mockReturnValue(null),
    userPalettes: [],
    onShowToast: noop,
    recentPaletteIds: [],
    look: "classic" as const,
    onLookChange: noop,
    fontSize: "",
    onFontSizeChange: noop,
    typography: DEFAULT_TYPOGRAPHY,
    rendererTarget: "",
    onRendererTargetChange: noop,
    lastExampleType: {},
    onRecordExampleType: noop,
    previewMode: "themed" as const,
    onPreviewModeChange: noop,
    hintResetToken: 0,
    onResetSyntaxHints: noop,
  };

  it("has zero critical/serious axe violations on initial render", async () => {
    const { container } = render(createElement(ApplyTab, applyTabProps));
    const { blocking, all } = await runAxe(container);
    logViolations("ApplyTab", all);
    expect(
      blocking,
      `Critical/serious violations:\n${blocking
        .map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.map((n) => n.html).slice(0, 2).join(", ")}`)
        .join("\n")}`,
    ).toHaveLength(0);
  });

  it("has zero critical/serious axe violations with customized colors", async () => {
    const customColors = {
      [palette.id]: palette.colors.map((c, i) =>
        i === 0 ? { ...c, value: "#ff5500" } : c,
      ),
    };
    const { container } = render(
      createElement(ApplyTab, {
        ...applyTabProps,
        customColors,
        hasCustomizations: true,
      }),
    );
    const { blocking, all } = await runAxe(container);
    logViolations("ApplyTab (customized)", all);
    expect(
      blocking,
      `Critical/serious violations:\n${blocking
        .map((v) => `  [${v.impact}] ${v.id}: ${v.description}`)
        .join("\n")}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3–5. ColorSwatch — individual swatch variants
// ---------------------------------------------------------------------------
describe("ColorSwatch (hex color)", () => {
  it("has zero critical/serious axe violations", async () => {
    const { container } = render(
      createElement(ColorSwatch, {
        color: { key: "primaryColor", label: "Primary Color", value: "#1e3a5f" },
        onChange: vi.fn(),
      }),
    );
    const { blocking, all } = await runAxe(container);
    logViolations("ColorSwatch hex", all);
    expect(
      blocking,
      `Critical/serious violations: ${blocking.map((v) => `${v.id}: ${v.description}`).join("; ")}`,
    ).toHaveLength(0);
  });
});

describe("ColorSwatch (font-family)", () => {
  it("has zero critical/serious axe violations", async () => {
    const { container } = render(
      createElement(ColorSwatch, {
        color: { key: "fontFamily", label: "Font Family", value: "trebuchet ms" },
        onChange: vi.fn(),
      }),
    );
    const { blocking, all } = await runAxe(container);
    logViolations("ColorSwatch font", all);
    expect(
      blocking,
      `Critical/serious violations: ${blocking.map((v) => `${v.id}: ${v.description}`).join("; ")}`,
    ).toHaveLength(0);
  });
});

describe("ColorSwatch (overridden, reset button)", () => {
  it("has zero critical/serious axe violations", async () => {
    const { container } = render(
      createElement(ColorSwatch, {
        color: { key: "edgeLabelBackground", label: "Edge Label Background", value: "#ffffff" },
        onChange: vi.fn(),
        isOverridden: true,
        onReset: vi.fn(),
      }),
    );
    const { blocking, all } = await runAxe(container);
    logViolations("ColorSwatch overridden", all);
    expect(
      blocking,
      `Critical/serious violations: ${blocking.map((v) => `${v.id}: ${v.description}`).join("; ")}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 6. ComposeTab — typography controls, palette editor, class browser
//
// Renders the full Compose tab with a realistic palette and default
// typography settings. The color editor grid, font-size tier controls,
// and palette selector are all present in this render.
// ---------------------------------------------------------------------------
describe("ComposeTab (color editor and palette editor)", () => {
  const palette = BRAND_PALETTES[0];
  const noop = vi.fn();

  const composeTabProps = {
    selectedPalette: palette,
    selectedPaletteId: palette.id,
    onSelectPalette: noop,
    customColors: {},
    onColorChange: noop,
    onResetPalette: noop,
    hasCustomizations: false,
    includeMetaComments: true,
    onIncludeMetaCommentsChange: noop,
    includeBadge: true,
    onIncludeBadgeChange: noop,
    customThemeName: "",
    onCustomThemeNameChange: noop,
    effectiveThemeName: palette.name,
    userPalettes: [],
    onSavePalette: noop,
    onImportPalette: noop,
    onDeleteUserPalette: noop,
    onShowToast: noop,
    look: "classic" as const,
    onLookChange: noop,
    fontSize: "",
    onFontSizeChange: noop,
    typography: DEFAULT_TYPOGRAPHY,
    onTypographyChange: noop,
    rendererTarget: "",
    onRendererTargetChange: noop,
    onUseExtractedTheme: noop,
    onSwitchTab: noop,
    importDiagnostics: null,
    onImportDiagnosticsChange: noop,
  };

  it("has zero critical/serious axe violations on initial render", async () => {
    const { container } = render(createElement(ComposeTab, composeTabProps));
    const { blocking, all } = await runAxe(container);
    logViolations("ComposeTab", all);
    expect(
      blocking,
      `Critical/serious violations:\n${blocking
        .map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.map((n) => n.html).slice(0, 2).join(", ")}`)
        .join("\n")}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 7. ExtractTab — paste input area, extract button, idle state
//
// Renders the Extract tab in its initial idle state (no code pasted yet).
// The textarea, extract button, and empty-state message are all present.
// ---------------------------------------------------------------------------
describe("ExtractTab (input area, idle state)", () => {
  const noop = vi.fn();

  const extractTabProps = {
    onUseExtractedTheme: noop,
    onSwitchTab: noop,
    onShowToast: noop,
  };

  it("has zero critical/serious axe violations on initial render", async () => {
    const { container } = render(createElement(ExtractTab, extractTabProps));
    const { blocking, all } = await runAxe(container);
    logViolations("ExtractTab (idle)", all);
    expect(
      blocking,
      `Critical/serious violations:\n${blocking
        .map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.map((n) => n.html).slice(0, 2).join(", ")}`)
        .join("\n")}`,
    ).toHaveLength(0);
  });
});
