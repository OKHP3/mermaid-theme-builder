// @vitest-environment happy-dom

/**
 * Tests that the renderer shortName badge renders in the correct locations
 * when a renderer target is active (Task #218, guarded by Tasks #276/#352).
 *
 * Behaviors covered — download menu rows:
 *   1. When rendererTarget is set, the ".md" (Markdown Bootstrap) download row
 *      shows the renderer shortName badge.
 *   2. When rendererTarget is set, the ".txt" (Prompt Scaffold) download row
 *      shows the renderer shortName badge.
 *   3. Both badges appear simultaneously when a renderer is active.
 *   4. No badge appears on either row when rendererTarget is empty.
 *
 * Behaviors covered — inline Prompt Scaffold copy button (Task #352):
 *   5. The copy button shows the renderer shortName badge when rendererTarget
 *      is set.
 *   6. The badge's title attribute contains "tailored for", confirming the
 *      tooltip text is intact.
 *   7. No badge appears on the copy button when rendererTarget is empty.
 */

// vi.mock must be hoisted before any imports due to vitest static analysis.
import { vi, describe, it, expect, afterEach, beforeEach } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

vi.mock("@/components/PaletteSelectorBar", () => ({
  PaletteSelectorBar: () => null,
}));

vi.mock("@/lib/clipboard", () => ({
  writeToClipboard: vi.fn().mockResolvedValue(undefined),
}));

import { render, screen, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement, act } from "react";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { ExportToolbar } from "@/pages/tabs/apply/ExportToolbar";
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

// ---------------------------------------------------------------------------
// 3. Renderer badge on the inline Prompt Scaffold copy button (Task #352)
// ---------------------------------------------------------------------------

/**
 * Returns the "Prompt Scaffold" inline copy button.
 *
 * The button contains a "Prompt Scaffold" text node alongside an optional
 * badge <span>. RTL's getByText matches the text node directly, so this
 * works even when the badge is rendered alongside it.
 */
function getPromptCopyBtn(): HTMLElement {
  return screen.getByText("Prompt Scaffold").closest("button") as HTMLElement;
}

describe("ApplyTab copy button — renderer badge on Prompt Scaffold", () => {
  it("shows the renderer shortName badge on the copy button when rendererTarget is set", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, rendererTarget: "github" }));

    expect(getPromptCopyBtn().textContent).toContain(GITHUB.shortName);
  });

  it('badge title attribute contains "tailored for"', () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, rendererTarget: "github" }));

    const badge = getPromptCopyBtn().querySelector('[title*="tailored for"]');
    expect(badge).not.toBeNull();
  });

  it("shows no renderer badge on the copy button when rendererTarget is empty", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, rendererTarget: "" }));

    expect(getPromptCopyBtn().textContent).not.toContain(GITHUB.shortName);
  });
});

// ---------------------------------------------------------------------------
// 4. Renderer badge hides during "Copied!" flash on Prompt Scaffold (Task #438)
//
// ExportToolbar gates the badge on `type === "prompt" && !copied` where
// `copied = copiedType === type`.  The test below validates the discriminator
// logic — that only copiedType === "prompt" would hide the badge, not a copy
// action on a different button.
//
// Drift note: clicking "Prompt Scaffold" in ExportToolbar calls onShowScaffoldModal()
// and returns early — setCopiedType("prompt") is never reached in current code, so
// the "Copied!" state for the prompt button cannot be triggered via normal user
// interaction. The guard is defensive (protects against future code changes). The
// test validates the discriminator by clicking "Styled Code" (which DOES enter
// copiedType="code") and asserting the prompt badge is unaffected.
// ---------------------------------------------------------------------------

describe("ApplyTab copy button — renderer badge hides during 'Copied!' flash (Task #438)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it("renderer badge is present on Prompt Scaffold button before any copy action", () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, rendererTarget: "github" }));

    const badge = getPromptCopyBtn().querySelector('[title*="tailored for"]');
    expect(badge, "badge should be present before any copy action").not.toBeNull();
  });

  it("renderer badge stays visible on Prompt Scaffold while Styled Code is in 'Copied!' state", async () => {
    render(createElement(ApplyTab, { ...BASE_PROPS, rendererTarget: "github" }));

    // Confirm badge is present before clicking anything.
    expect(getPromptCopyBtn().querySelector('[title*="tailored for"]')).not.toBeNull();

    // Click "Styled Code" — this sets copiedType = "code" in ExportToolbar.
    fireEvent.click(screen.getByRole("button", { name: "Styled Code" }));
    // Flush the writeToClipboard promise, then let React commit the state update.
    await act(async () => {
      await Promise.resolve();
    });

    // "Styled Code" button should now show "Copied!" (copiedType = "code").
    // The button text changes, so look for it by content rather than name.
    const codeBtns = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.includes("Copied!"));
    expect(codeBtns.length, "expected one button in 'Copied!' state").toBeGreaterThan(0);

    // The Prompt Scaffold badge must STILL be present:
    // copiedType is "code", not "prompt", so copied = (copiedType === "prompt") = false,
    // and the !copied guard allows the badge to render.
    const badgeDuringFlash = getPromptCopyBtn().querySelector('[title*="tailored for"]');
    expect(
      badgeDuringFlash,
      "renderer badge must remain on Prompt Scaffold while copiedType is 'code', not 'prompt'"
    ).not.toBeNull();

    // Advance past the 2-second copy-flash timeout to reset copiedType.
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    // Badge still present after the flash expires.
    expect(getPromptCopyBtn().querySelector('[title*="tailored for"]')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 5. Direct ExportToolbar unit test — badge hidden when copiedType = "prompt"
//
// Clicking "Prompt Scaffold" in production opens the scaffold modal (early
// return in handleCopy), so copiedType is never set to "prompt" via normal
// user interaction. ExportToolbar accepts `_testInitialCopiedType` as a test
// seam so we can seed the state directly and verify the guard holds.
// ---------------------------------------------------------------------------

const TOOLBAR_BASE_PROPS = {
  warnings: [] as string[],
  showCapabilityNote: false,
  capability: undefined as import("@/lib/detector").DetectionResult["capability"],
  hasCustomizations: false,
  onOpenColorEditor: noop,
  inputCode: DIAGRAM,
  exportCode: DIAGRAM,
  effectiveExportCode: DIAGRAM,
  selectedPalette: PALETTE,
  exportOptions: {
    palette: PALETTE,
    diagramFamily: "flowchart" as import("@/lib/theme-engine").ExportOptions["diagramFamily"],
    includeMetaComments: false,
    includeBadge: false,
  },
  effectiveThemeName: PALETTE.name,
  themedCode: DIAGRAM,
  typography: DEFAULT_TYPOGRAPHY,
  allPalettes: BRAND_PALETTES,
  rendererProfile: GITHUB,
  promptIsThemeOnly: false,
  onShowScaffoldModal: noop,
  onShowToast: noop,
};

describe("ExportToolbar — renderer badge hidden when copiedType is 'prompt' (Task #438)", () => {
  it("renderer badge is absent on the Prompt Scaffold button when _testInitialCopiedType is 'prompt'", () => {
    const { container } = render(
      createElement(ExportToolbar, {
        ...TOOLBAR_BASE_PROPS,
        _testInitialCopiedType: "prompt",
      })
    );

    // The Prompt Scaffold button text changes to "Copied!" in this state.
    const promptBtn = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (b) => b.textContent?.includes("Copied!")
    );
    expect(promptBtn, "expected the Prompt Scaffold button to be in Copied! state").toBeDefined();

    // The renderer badge must NOT be present while copied = true.
    const badge = promptBtn!.querySelector('[title*="tailored for"]');
    expect(badge, "renderer badge must be absent while the button shows 'Copied!'").toBeNull();
  });

  it("renderer badge is present on the Prompt Scaffold button when not in copied state (baseline)", () => {
    const { container } = render(
      createElement(ExportToolbar, {
        ...TOOLBAR_BASE_PROPS,
        _testInitialCopiedType: null,
      })
    );

    const promptBtn = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (b) => b.textContent?.includes("Prompt Scaffold")
    );
    expect(promptBtn, "expected the Prompt Scaffold button to be visible").toBeDefined();

    const badge = promptBtn!.querySelector('[title*="tailored for"]');
    expect(badge, "renderer badge must be present when not in copied state").not.toBeNull();
  });
});
