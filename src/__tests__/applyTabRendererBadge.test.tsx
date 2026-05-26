// @vitest-environment happy-dom

/**
 * Tests that the renderer shortName badge renders on the correct download menu
 * rows when a renderer target is active (Task #218, guarded by Task #276).
 *
 * Behaviors covered:
 *   1. When rendererTarget is set, the ".md" (Markdown Bootstrap) download row
 *      shows the renderer shortName badge.
 *   2. When rendererTarget is set, the ".txt" (Prompt Scaffold) download row
 *      shows the renderer shortName badge.
 *   3. Both badges appear simultaneously when a renderer is active.
 *   4. No badge appears on either row when rendererTarget is empty.
 */

// vi.mock must be hoisted before any imports due to vitest static analysis.
import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

vi.mock("@/components/PaletteSelectorBar", () => ({
  PaletteSelectorBar: () => null,
}));

import { render, screen, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement } from "react";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";
import { getRendererById } from "@/data/renderer-parity";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DIAGRAM = "flowchart TD\n  A[Start] --> B[End]";
const PALETTE = BRAND_PALETTES[0];
// "github" is a well-known renderer with shortName "GitHub".
const GITHUB = getRendererById("github")!;

function noop() {}

/** Minimal but type-safe set of props for ApplyTab. */
const BASE_PROPS = {
  selectedPalette: PALETTE,
  selectedPaletteId: PALETTE.id,
  onSelectPalette: noop,
  customColors: {} as Record<string, import("@/lib/palettes").ThemeColor[]>,
  onColorChange: noop,
  onResetPalette: noop,
  onResetColor: noop,
  hasCustomizations: false,
  inputCode: DIAGRAM,
  onInputChange: noop,
  includeMetaComments: false,
  includeBadge: false,
  effectiveThemeName: PALETTE.name,
  onSwitchTab: noop,
  onNavigateToParityMatrix: noop,
  onExtractTheme: () => null,
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
  lastExampleType: {} as Record<string, "flowchart" | "sequence">,
  onRecordExampleType: noop,
  previewMode: "original" as const,
  onPreviewModeChange: noop,
  hintResetToken: 0,
  onResetSyntaxHints: noop,
};

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Opens the download menu by clicking the "Download" button. */
function openDownloadMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
}

/** Returns the download menu row button that shows the given file-extension label. */
function getDownloadRow(label: string): HTMLElement {
  return screen.getByText(label).closest("button") as HTMLElement;
}

// ---------------------------------------------------------------------------
// 1. Renderer badge present when rendererTarget is set
// ---------------------------------------------------------------------------

describe("ApplyTab download menu — renderer badge with active renderer target", () => {
  it("shows the renderer shortName badge on the Markdown Bootstrap (.md) row", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, rendererTarget: "github" }));
    openDownloadMenu();

    const mdRow = getDownloadRow(".md");
    expect(mdRow.textContent).toContain(GITHUB.shortName);
  });

  it("shows the renderer shortName badge on the Prompt Scaffold (.txt) row", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, rendererTarget: "github" }));
    openDownloadMenu();

    const scaffoldRow = getDownloadRow(".txt");
    expect(scaffoldRow.textContent).toContain(GITHUB.shortName);
  });

  it("renders the badge on both rows simultaneously (not just one)", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, rendererTarget: "github" }));
    openDownloadMenu();

    const mdRow = getDownloadRow(".md");
    const scaffoldRow = getDownloadRow(".txt");
    expect(mdRow.textContent).toContain(GITHUB.shortName);
    expect(scaffoldRow.textContent).toContain(GITHUB.shortName);
  });
});

// ---------------------------------------------------------------------------
// 2. No renderer badge when rendererTarget is empty
// ---------------------------------------------------------------------------

describe("ApplyTab download menu — no renderer badge without renderer target", () => {
  it("shows no renderer badge on the Markdown Bootstrap row when rendererTarget is empty", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, rendererTarget: "" }));
    openDownloadMenu();

    const mdRow = getDownloadRow(".md");
    expect(mdRow.textContent).not.toContain(GITHUB.shortName);
  });

  it("shows no renderer badge on the Prompt Scaffold row when rendererTarget is empty", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, rendererTarget: "" }));
    openDownloadMenu();

    const scaffoldRow = getDownloadRow(".txt");
    expect(scaffoldRow.textContent).not.toContain(GITHUB.shortName);
  });
});
