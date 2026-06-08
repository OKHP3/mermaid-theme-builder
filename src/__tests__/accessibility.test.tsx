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

import { render, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import axe from "axe-core";

import { AppShell } from "@/App";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { ExtractTab } from "@/pages/tabs/ExtractTab";
import { ExamplesTab } from "@/pages/tabs/ExamplesTab";
import { ReferenceTab } from "@/pages/tabs/ReferenceTab";
import { ColorSwatch } from "@/components/ColorSwatch";
import { ClassBrowser } from "@/components/ClassBrowser";
import { DiagramInventory } from "@/components/DiagramInventory";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";
import { getClassDefs } from "@/lib/theme-engine";

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
    (v) => v.impact === "critical" || v.impact === "serious"
  );
  return { all: results.violations, blocking };
}

function logViolations(label: string, violations: axe.Result[]) {
  if (violations.length > 0) {
    console.info(
      `[a11y] ${label} violations:`,
      violations.map((v) => `${v.impact}: ${v.id} — ${v.description}`)
    );
  }
}

// ---------------------------------------------------------------------------
// Invisible-button focus regression guard helpers
//
// Checks that every opacity-0 interactive element in a rendered component has
// at least one keyboard-visibility escape class:
//   • focus:opacity-100  /  focus-visible:opacity-100  (direct focus)
//   • group-focus-within:opacity-100 + an ancestor carrying the Tailwind
//     "group" class  (visible when the ancestor's :focus-within fires —
//     which happens when the element itself is focused)
//
// Note: happy-dom has no CSS engine so getComputedStyle().opacity is always
// "". This structural className check is the reliable alternative. It targets
// the exact regression pattern — opacity-0 without a focus counterpart — that
// was historically spread across multiple components.
// ---------------------------------------------------------------------------

const DIRECT_FOCUS_ESCAPE_CLASSES = ["focus:opacity-100", "focus-visible:opacity-100"];

function isInteractiveEl(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return (
    tag === "button" ||
    tag === "input" ||
    (tag === "a" && el.hasAttribute("href")) ||
    el.getAttribute("role") === "button" ||
    (el.hasAttribute("tabindex") && el.getAttribute("tabindex") !== "-1")
  );
}

function hasGroupAncestor(el: Element): boolean {
  let node = el.parentElement;
  while (node) {
    const cn = typeof node.className === "string" ? node.className : "";
    if (cn.split(/\s+/).some((c) => c === "group" || c.startsWith("group/"))) return true;
    node = node.parentElement;
  }
  return false;
}

interface FocusViolator {
  tag: string;
  ariaLabel: string | null;
  reason: string;
}

function findOpacity0WithoutFocusEscape(container: HTMLElement): FocusViolator[] {
  const violators: FocusViolator[] = [];
  const allEls = container.querySelectorAll<HTMLElement>("*");

  for (const el of allEls) {
    const cn = typeof el.className === "string" ? el.className : "";
    const classes = cn.split(/\s+/).filter(Boolean);

    if (!classes.includes("opacity-0")) continue;
    if (!isInteractiveEl(el)) continue;

    if (classes.some((c) => DIRECT_FOCUS_ESCAPE_CLASSES.includes(c))) continue;

    if (classes.includes("group-focus-within:opacity-100") && hasGroupAncestor(el)) continue;

    violators.push({
      tag: el.tagName.toLowerCase(),
      ariaLabel: el.getAttribute("aria-label"),
      reason: classes.includes("group-focus-within:opacity-100")
        ? "group-focus-within:opacity-100 present but no .group ancestor found in DOM"
        : "missing focus:opacity-100, focus-visible:opacity-100, or group-focus-within:opacity-100 (with .group ancestor)",
    });
  }
  return violators;
}

function formatFocusViolators(vs: FocusViolator[]): string {
  if (vs.length === 0) return "";
  return (
    "opacity-0 interactive elements without keyboard-visibility escape:\n" +
    vs
      .map((v) => `  <${v.tag}${v.ariaLabel ? ` aria-label="${v.ariaLabel}"` : ""}> — ${v.reason}`)
      .join("\n")
  );
}

// ---------------------------------------------------------------------------
// Unlabeled <th> guard helpers
//
// Scans a rendered container for <th> elements that have none of:
//   • visible text content (trimmed non-empty textContent)
//   • an aria-label attribute
//   • aria-hidden="true"
//
// A <th> without any of the above is invisible to screen readers and will
// surface as an axe "scope-attr-unambiguous" / empty-header violation.
// The guard is intentionally broad: it catches header cells with only
// icon-children or purely visual content as well as genuinely empty cells.
// ---------------------------------------------------------------------------

function findUnlabeledThs(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("th")).filter((th) => {
    const hasText = (th.textContent ?? "").trim().length > 0;
    const hasAriaLabel = th.hasAttribute("aria-label");
    const hasAriaHidden = th.getAttribute("aria-hidden") === "true";
    return !hasText && !hasAriaLabel && !hasAriaHidden;
  });
}

function formatUnlabeledThs(ths: HTMLElement[]): string {
  if (ths.length === 0) return "";
  return (
    `Found ${ths.length} <th> element(s) with no discernible text, aria-label, or aria-hidden:\n` +
    ths.map((th) => `  ${th.outerHTML}`).join("\n")
  );
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
        .map(
          (v) =>
            `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes
              .map((n) => n.html)
              .slice(0, 2)
              .join(", ")}`
        )
        .join("\n")}`
    ).toHaveLength(0);
  }, 15000);

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

  it("has no unlabeled <th> elements", () => {
    const { container } = render(createElement(AppShell, null));
    const unlabeled = findUnlabeledThs(container);
    expect(unlabeled, formatUnlabeledThs(unlabeled)).toHaveLength(0);
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
        .map(
          (v) =>
            `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes
              .map((n) => n.html)
              .slice(0, 2)
              .join(", ")}`
        )
        .join("\n")}`
    ).toHaveLength(0);
  });

  it("has zero critical/serious axe violations with customized colors", async () => {
    const customColors = {
      [palette.id]: palette.colors.map((c, i) => (i === 0 ? { ...c, value: "#ff5500" } : c)),
    };
    const { container } = render(
      createElement(ApplyTab, {
        ...applyTabProps,
        customColors,
        hasCustomizations: true,
      })
    );
    const { blocking, all } = await runAxe(container);
    logViolations("ApplyTab (customized)", all);
    expect(
      blocking,
      `Critical/serious violations:\n${blocking
        .map((v) => `  [${v.impact}] ${v.id}: ${v.description}`)
        .join("\n")}`
    ).toHaveLength(0);
  });

  it("has no unlabeled <th> elements", () => {
    const { container } = render(createElement(ApplyTab, applyTabProps));
    const unlabeled = findUnlabeledThs(container);
    expect(unlabeled, formatUnlabeledThs(unlabeled)).toHaveLength(0);
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
      })
    );
    const { blocking, all } = await runAxe(container);
    logViolations("ColorSwatch hex", all);
    expect(
      blocking,
      `Critical/serious violations: ${blocking.map((v) => `${v.id}: ${v.description}`).join("; ")}`
    ).toHaveLength(0);
  });
});

describe("ColorSwatch (font-family)", () => {
  it("has zero critical/serious axe violations", async () => {
    const { container } = render(
      createElement(ColorSwatch, {
        color: { key: "fontFamily", label: "Font Family", value: "trebuchet ms" },
        onChange: vi.fn(),
      })
    );
    const { blocking, all } = await runAxe(container);
    logViolations("ColorSwatch font", all);
    expect(
      blocking,
      `Critical/serious violations: ${blocking.map((v) => `${v.id}: ${v.description}`).join("; ")}`
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
      })
    );
    const { blocking, all } = await runAxe(container);
    logViolations("ColorSwatch overridden", all);
    expect(
      blocking,
      `Critical/serious violations: ${blocking.map((v) => `${v.id}: ${v.description}`).join("; ")}`
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
    onNavigateToParityMatrix: noop,
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
        .map(
          (v) =>
            `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes
              .map((n) => n.html)
              .slice(0, 2)
              .join(", ")}`
        )
        .join("\n")}`
    ).toHaveLength(0);
  });

  it("has no unlabeled <th> elements", () => {
    const { container } = render(createElement(ComposeTab, composeTabProps));
    const unlabeled = findUnlabeledThs(container);
    expect(unlabeled, formatUnlabeledThs(unlabeled)).toHaveLength(0);
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
        .map(
          (v) =>
            `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes
              .map((n) => n.html)
              .slice(0, 2)
              .join(", ")}`
        )
        .join("\n")}`
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 8–10. Invisible button focus regression guard
//
// Structural check: every opacity-0 interactive element in the named
// components must have at least one keyboard-visibility escape class.
//
// A failure here means a button was made invisible without a matching focus
// class — it would be unreachable by keyboard until a mouse hover occurs.
//
// Failure message shows which element was found and why it doesn't pass.
// ---------------------------------------------------------------------------

// 8. ColorSwatch — reset button (only rendered when isOverridden=true)
describe("Invisible button focus regression — ColorSwatch reset button", () => {
  it("reset button (opacity-0) has a keyboard-visibility escape class", () => {
    const { container } = render(
      createElement(ColorSwatch, {
        color: { key: "primaryColor", label: "Primary Color", value: "#1e3a5f" },
        onChange: vi.fn(),
        isOverridden: true,
        onReset: vi.fn(),
      })
    );
    const violations = findOpacity0WithoutFocusEscape(container);
    expect(violations, formatFocusViolators(violations)).toHaveLength(0);
  });
});

// 9. ComposeTab — delete-palette button in PaletteRow (opacity-0, focus:opacity-100)
//
// PaletteRow is wired into ComposeTab's "My Palettes" section to display the
// user-palette list. Each row includes an opacity-0 delete button that must
// retain its focus:opacity-100 escape class. The guard renders ComposeTab with
// a non-empty userPalettes list so PaletteRow actually instantiates and the
// scan covers the real button.
describe("Invisible button focus regression — ComposeTab palette rows", () => {
  it("all opacity-0 interactive elements have a keyboard-visibility escape class", () => {
    const palette = BRAND_PALETTES[0];
    const noop = vi.fn();
    const { container } = render(
      createElement(ComposeTab, {
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
        userPalettes: [BRAND_PALETTES[0]],
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
        onNavigateToParityMatrix: noop,
        importDiagnostics: null,
        onImportDiagnosticsChange: noop,
      })
    );
    const violations = findOpacity0WithoutFocusEscape(container);
    expect(violations, formatFocusViolators(violations)).toHaveLength(0);
  });
});

// 10. ClassBrowser — copy-class button (opacity-0, group-focus-within:opacity-100
//     inside a .group ancestor — no direct focus:opacity-100)
describe("Invisible button focus regression — ClassBrowser copy button", () => {
  it("copy-class button (opacity-0) has a keyboard-visibility escape class", () => {
    const classDefs = getClassDefs(BRAND_PALETTES[0]);
    const { container } = render(
      createElement(ClassBrowser, { classDefs, supportsClassDef: true })
    );
    const violations = findOpacity0WithoutFocusEscape(container);
    expect(violations, formatFocusViolators(violations)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 11. ExamplesTab — browse catalog, search field, group navigation, entry cards
//
// Renders ExamplesTab with a realistic palette and the full EXAMPLE_CATALOG
// (via buildExampleList inside the module). The search input, section
// headers, entry buttons, and action bar are all present on initial render.
// ---------------------------------------------------------------------------
describe("ExamplesTab (browse catalog)", () => {
  const palette = BRAND_PALETTES[0];
  const noop = vi.fn();

  const examplesTabProps = {
    selectedPalette: palette,
    selectedPaletteId: palette.id,
    allPalettes: BRAND_PALETTES,
    customColors: {},
    onSelectPalette: noop,
    onLoadExample: noop,
  };

  it("has zero critical/serious axe violations on initial render", async () => {
    const { container } = render(createElement(ExamplesTab, examplesTabProps));
    const { blocking, all } = await runAxe(container);
    logViolations("ExamplesTab", all);
    expect(
      blocking,
      `Critical/serious violations:\n${blocking
        .map(
          (v) =>
            `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes
              .map((n) => n.html)
              .slice(0, 2)
              .join(", ")}`
        )
        .join("\n")}`
    ).toHaveLength(0);
  });

  it("has no unlabeled <th> elements", () => {
    const { container } = render(createElement(ExamplesTab, examplesTabProps));
    const unlabeled = findUnlabeledThs(container);
    expect(unlabeled, formatUnlabeledThs(unlabeled)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 12. ReferenceTab — capabilities table, collapsible Renderer Parity Matrix,
//     Class Library section
//
// Renders ReferenceTab with a realistic palette and supportsClassDef=true so
// both collapsible <details> sections are open and fully rendered for scanning.
// ---------------------------------------------------------------------------
describe("ReferenceTab (capabilities table)", () => {
  const palette = BRAND_PALETTES[0];
  const noop = vi.fn();

  const referenceTabProps = {
    selectedPalette: palette,
    selectedPaletteId: palette.id,
    allPalettes: BRAND_PALETTES,
    customColors: {},
    onSelectPalette: noop,
    supportsClassDef: true,
    inputCode: "flowchart TD\n  A[Start] --> B[End]",
  };

  it("has zero critical/serious axe violations on initial render", async () => {
    const { container } = render(createElement(ReferenceTab, referenceTabProps));
    const { blocking, all } = await runAxe(container);
    logViolations("ReferenceTab", all);
    expect(
      blocking,
      `Critical/serious violations:\n${blocking
        .map(
          (v) =>
            `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes
              .map((n) => n.html)
              .slice(0, 2)
              .join(", ")}`
        )
        .join("\n")}`
    ).toHaveLength(0);
  });

  it("has no unlabeled <th> elements", () => {
    const { container } = render(createElement(ReferenceTab, referenceTabProps));
    const unlabeled = findUnlabeledThs(container);
    expect(unlabeled, formatUnlabeledThs(unlabeled)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 13. DiagramInventory — standalone full-screen view (embedded=false)
//
// Renders DiagramInventory in its non-embedded (full-screen overlay) state
// with onClose provided. The filter tabs, search input, capabilities table,
// gaps table, close button, and footer legend are all present on initial render.
// ---------------------------------------------------------------------------
describe("DiagramInventory (standalone full-screen view)", () => {
  it("has zero critical/serious axe violations on initial render", async () => {
    const { container } = render(
      createElement(DiagramInventory, { embedded: false, onClose: vi.fn() })
    );
    const { blocking, all } = await runAxe(container);
    logViolations("DiagramInventory (standalone)", all);
    expect(
      blocking,
      `Critical/serious violations:\n${blocking
        .map(
          (v) =>
            `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes
              .map((n) => n.html)
              .slice(0, 2)
              .join(", ")}`
        )
        .join("\n")}`
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 14. DiagramInventory — ExamplesTab modal state
//
// Renders ExamplesTab with realistic props, then clicks "Browse all supported
// families" to open the DiagramInventory modal (showInventory=true). The modal
// shell, embedded DiagramInventory, close button, and backdrop are all in the
// DOM. axe scans the full container including the open overlay.
// ---------------------------------------------------------------------------
describe("DiagramInventory (ExamplesTab modal state)", () => {
  it("has zero critical/serious axe violations when inventory modal is open", async () => {
    const noop = vi.fn();
    const { container } = render(
      createElement(ExamplesTab, {
        selectedPalette: BRAND_PALETTES[0],
        selectedPaletteId: BRAND_PALETTES[0].id,
        allPalettes: BRAND_PALETTES,
        customColors: {},
        onSelectPalette: noop,
        onLoadExample: noop,
      })
    );
    const browseBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Browse all supported families")
    );
    expect(browseBtn, "'Browse all supported families' button must exist").toBeTruthy();
    fireEvent.click(browseBtn!);
    const { blocking, all } = await runAxe(container);
    logViolations("DiagramInventory (ExamplesTab modal)", all);
    expect(
      blocking,
      `Critical/serious violations:\n${blocking
        .map(
          (v) =>
            `  [${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes
              .map((n) => n.html)
              .slice(0, 2)
              .join(", ")}`
        )
        .join("\n")}`
    ).toHaveLength(0);
  });
});
