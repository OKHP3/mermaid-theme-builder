// @vitest-environment happy-dom

/**
 * Component tests: 'No classDef' badge visibility in ApplyTab (Task #270).
 *
 * `promptIsThemeOnly` in ApplyTab.tsx drives a badge on the Prompt Scaffold
 * copy button and (when open) on the download menu's scaffold row.  These
 * tests mount the real ApplyTab so that a regression in the JSX render path
 * (e.g. a flipped conditional or a wrong variable name) would be caught even
 * if the underlying CLASSDEF_CAPABLE_FAMILIES unit tests still pass.
 *
 * Strategy
 * --------
 * ApplyTab renders the copy-button row unconditionally when inputCode is
 * non-empty.  The Prompt Scaffold button always shows, and the "No classDef"
 * badge inside it appears synchronously via a `useMemo`-derived boolean —
 * no async ticks needed.  Mermaid is mocked so no canvas/SVG errors occur.
 *
 * Families tested
 * ---------------
 *   journey   — not in CLASSDEF_CAPABLE_FAMILIES → badge expected
 *   timeline  — not in CLASSDEF_CAPABLE_FAMILIES → badge expected
 *   flowchart — IN CLASSDEF_CAPABLE_FAMILIES      → badge must be absent
 */

// vi.mock must be hoisted before any imports (vitest static analysis).
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PALETTE = BRAND_PALETTES[0];

function noop() {}

/** Minimal but type-safe set of props for ApplyTab (mirrors applyTabDiffWiring). */
const BASE_PROPS = {
  selectedPalette: PALETTE,
  selectedPaletteId: PALETTE.id,
  onSelectPalette: noop,
  customColors: {} as Record<string, import("@/lib/palettes").ThemeColor[]>,
  onColorChange: noop,
  onResetPalette: noop,
  onResetColor: noop,
  hasCustomizations: false,
  inputCode: "",
  onInputChange: noop,
  includeMetaComments: false,
  includeBadge: false,
  effectiveThemeName: PALETTE.name,
  onSwitchTab: noop,
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

/** A journey diagram — "journey" is NOT in CLASSDEF_CAPABLE_FAMILIES. */
const JOURNEY_DIAGRAM = `journey
  title My Morning Routine
  section Go to Work
    Make tea: 5: Me
    Go upstairs: 3: Me, Cat
    Do work: 1: Me, Cat`;

/** A timeline diagram — "timeline" is NOT in CLASSDEF_CAPABLE_FAMILIES. */
const TIMELINE_DIAGRAM = `timeline
  title History of Social Media Platform
  2002 : LinkedIn
  2004 : Facebook
  2006 : Twitter
  2011 : Google+`;

/** A flowchart diagram — "flowchart" IS in CLASSDEF_CAPABLE_FAMILIES. */
const FLOWCHART_DIAGRAM = "flowchart TD\n  A[Start] --> B[Process] --> C[End]";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Badge present — non-classDef-capable families
// ---------------------------------------------------------------------------

describe("ApplyTab — 'No classDef' badge appears for non-classDef-capable families", () => {
  it("renders the 'No classDef' badge on the Prompt Scaffold button for a journey diagram", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, inputCode: JOURNEY_DIAGRAM }));
    expect(screen.getByText("No classDef")).toBeTruthy();
  });

  it("badge has the correct tooltip for a journey diagram", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, inputCode: JOURNEY_DIAGRAM }));
    const badge = screen.getByText("No classDef");
    expect(badge.getAttribute("title")).toBe(
      "This diagram type only supports palette-level theming, not per-node color classes"
    );
  });

  it("renders the 'No classDef' badge on the Prompt Scaffold button for a timeline diagram", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, inputCode: TIMELINE_DIAGRAM }));
    expect(screen.getByText("No classDef")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Badge absent — classDef-capable families
// ---------------------------------------------------------------------------

describe("ApplyTab — 'No classDef' badge is absent for classDef-capable families", () => {
  it("does not render 'No classDef' for a flowchart diagram", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, inputCode: FLOWCHART_DIAGRAM }));
    expect(screen.queryByText("No classDef")).toBeNull();
  });

  it("does not render 'No classDef' when inputCode is empty (unknown family)", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, inputCode: "" }));
    expect(screen.queryByText("No classDef")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Download-menu badge — opens the menu and verifies badge in scaffold row
// ---------------------------------------------------------------------------

describe("ApplyTab — 'No classDef' badge in download menu scaffold row", () => {
  it("shows 'No classDef' next to the scaffold row after opening the download menu", () => {
    const { container } = render(
      createElement(ApplyTab, { ...BASE_PROPS, inputCode: JOURNEY_DIAGRAM })
    );

    // Use fireEvent so React's synthetic event system processes the click.
    const allButtons = Array.from(container.querySelectorAll("button"));
    const dlBtn = allButtons.find((b) => b.textContent?.includes("Download"));
    expect(dlBtn).toBeTruthy();
    fireEvent.click(dlBtn as HTMLButtonElement);

    // After the menu opens, two "No classDef" spans are present:
    // one in the copy-button bar, one in the scaffold download row.
    const badges = screen.getAllByText("No classDef");
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it("download menu scaffold row has no 'No classDef' for a flowchart diagram", () => {
    const { container } = render(
      createElement(ApplyTab, { ...BASE_PROPS, inputCode: FLOWCHART_DIAGRAM })
    );
    const allButtons = Array.from(container.querySelectorAll("button"));
    const dlBtn = allButtons.find((b) => b.textContent?.includes("Download"));
    expect(dlBtn).toBeTruthy();
    fireEvent.click(dlBtn as HTMLButtonElement);

    expect(screen.queryByText("No classDef")).toBeNull();
  });
});
