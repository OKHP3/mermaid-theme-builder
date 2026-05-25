// @vitest-environment happy-dom

/**
 * Bundle import warning banner integration tests (Task #235).
 *
 * Verifies that ComposeTab renders the amber warning banner when
 * `importDiagnostics` is non-null with missingKeys / unknownKeys, that the
 * dismiss button calls `onImportDiagnosticsChange(null)`, and that the banner
 * text is correct for the share-URL code path.
 *
 * The banner lives inside the "My Palettes" collapsible section, which is
 * closed by default (className="hidden" via Tailwind). happy-dom does not
 * apply CSS stylesheets, so the element remains reachable by RTL queries even
 * when the section is visually closed.
 */

import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";

afterEach(() => {
  cleanup();
});

const palette = BRAND_PALETTES[0];

type ImportDiagnostics = {
  missingKeys: string[];
  unknownKeys: string[];
  invalidValues: Array<{ key: string; value: string }>;
};

function makeBaseProps(overrides: Record<string, unknown> = {}) {
  const noop = vi.fn();
  return {
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
    importDiagnostics: null as ImportDiagnostics | null,
    onImportDiagnosticsChange: noop,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// missingKeys
// ---------------------------------------------------------------------------

describe("Import warning banner — missingKeys", () => {
  it("renders the banner heading when importDiagnostics has missingKeys", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: ["primaryBorderColor", "secondaryColor"],
            unknownKeys: [],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText("Palette import warnings")).toBeTruthy();
  });

  it("renders each missing key label in the banner", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: ["primaryBorderColor", "secondaryColor"],
            unknownKeys: [],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText("primaryBorderColor")).toBeTruthy();
    expect(screen.getByText("secondaryColor")).toBeTruthy();
  });

  it("shows plural 'keys' prose when more than one key is missing", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: ["primaryBorderColor", "secondaryColor"],
            unknownKeys: [],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText(/Missing required keys/)).toBeTruthy();
  });

  it("shows singular 'key' prose when exactly one key is missing", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: ["lineColor"],
            unknownKeys: [],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText(/Missing required key/)).toBeTruthy();
    expect(screen.getByText("lineColor")).toBeTruthy();
  });

  it("shows the 'diagram may render with Mermaid defaults' prose", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: ["lineColor"],
            unknownKeys: [],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText(/diagram may render with Mermaid defaults/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// unknownKeys
// ---------------------------------------------------------------------------

describe("Import warning banner — unknownKeys", () => {
  it("renders the banner heading when importDiagnostics has unknownKeys", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: [],
            unknownKeys: ["weirdCustomProp", "anotherUnknownKey"],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText("Palette import warnings")).toBeTruthy();
  });

  it("renders each unknown key label in the banner", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: [],
            unknownKeys: ["weirdCustomProp", "anotherUnknownKey"],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText("weirdCustomProp")).toBeTruthy();
    expect(screen.getByText("anotherUnknownKey")).toBeTruthy();
  });

  it("shows 'Unrecognized' prose for unknown keys", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: [],
            unknownKeys: ["weirdCustomProp"],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText(/Unrecognized/)).toBeTruthy();
  });

  it("shows plural 'keys' prose when more than one unknown key", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: [],
            unknownKeys: ["weirdCustomProp", "anotherUnknownKey"],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText(/Unrecognized keys/)).toBeTruthy();
  });

  it("shows singular 'key' prose when exactly one unknown key", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: [],
            unknownKeys: ["weirdCustomProp"],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText(/Unrecognized key/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Dismiss button
// ---------------------------------------------------------------------------

describe("Import warning banner — dismiss button", () => {
  it("calls onImportDiagnosticsChange(null) when the dismiss button is clicked", () => {
    const onImportDiagnosticsChange = vi.fn();
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: ["primaryBorderColor"],
            unknownKeys: [],
            invalidValues: [],
          },
          onImportDiagnosticsChange,
        })
      )
    );
    const dismissBtn = screen.getByRole("button", {
      name: "Dismiss import warnings",
      hidden: true,
    });
    fireEvent.click(dismissBtn);
    expect(onImportDiagnosticsChange).toHaveBeenCalledTimes(1);
    expect(onImportDiagnosticsChange).toHaveBeenCalledWith(null);
  });

  it("does not render the banner when importDiagnostics is null", () => {
    render(createElement(ComposeTab, makeBaseProps({ importDiagnostics: null })));
    expect(screen.queryByText("Palette import warnings")).toBeNull();
  });

  it("does not render the banner when all diagnostic arrays are empty", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: [],
            unknownKeys: [],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.queryByText("Palette import warnings")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Share-URL path
// ---------------------------------------------------------------------------

describe("Import warning banner — share-URL path", () => {
  it("renders banner with all missing keys populated from a share-URL parse", () => {
    // Mirrors the App-level code path: share URL decoded → missing required keys
    // detected → importDiagnostics set and forwarded to ComposeTab as a prop.
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: ["lineColor", "secondaryColor", "tertiaryColor"],
            unknownKeys: [],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText("Palette import warnings")).toBeTruthy();
    expect(screen.getByText("lineColor")).toBeTruthy();
    expect(screen.getByText("secondaryColor")).toBeTruthy();
    expect(screen.getByText("tertiaryColor")).toBeTruthy();
  });

  it("shows plural 'keys' prose for multiple missing keys from share-URL", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: ["lineColor", "secondaryColor", "tertiaryColor"],
            unknownKeys: [],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText(/Missing required keys/)).toBeTruthy();
  });

  it("shows the 'diagram may render with Mermaid defaults' fallback warning", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: ["lineColor", "secondaryColor"],
            unknownKeys: [],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText(/diagram may render with Mermaid defaults/)).toBeTruthy();
  });

  it("renders both missing and unknown key sections together", () => {
    render(
      createElement(
        ComposeTab,
        makeBaseProps({
          importDiagnostics: {
            missingKeys: ["lineColor"],
            unknownKeys: ["customBrandColor"],
            invalidValues: [],
          },
        })
      )
    );
    expect(screen.getByText("lineColor")).toBeTruthy();
    expect(screen.getByText("customBrandColor")).toBeTruthy();
    expect(screen.getByText(/Missing required/)).toBeTruthy();
    expect(screen.getByText(/Unrecognized/)).toBeTruthy();
  });
});
