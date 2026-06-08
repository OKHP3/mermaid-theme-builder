// @vitest-environment happy-dom

/**
 * Tests for Code tab keyboard accessibility after the textarea-to-pre switch
 * (Task #253).
 *
 * Three layers of coverage:
 *
 *   A. HighlightedCode <pre> focusability and aria-label forwarding.
 *      The <pre> must carry tabIndex=0 so keyboard users can Tab into it;
 *      the empty-placeholder path must NOT add a tabIndex (nothing to read).
 *
 *   B. Edit / Reset toggle — minimal CodeModePanel wrapper using the real
 *      useCodeEditorOverride hook to verify conditional rendering logic.
 *
 *   C. ApplyTab integration — renders the real ApplyTab component with
 *      previewMode="code" and realistic props. Asserts:
 *        - view mode: focusable <pre aria-label="Styled code output">
 *        - clicking Edit: <textarea aria-label="Styled code output — edit before copying">
 *        - clicking Reset: <pre> restored with tabindex="0"
 */

// vi.mock calls are hoisted by vitest — must appear before any imports.
import { vi, describe, it, expect, afterEach, beforeAll } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

vi.mock("@/components/PaletteSelectorBar", () => ({
  PaletteSelectorBar: () => null,
}));

vi.mock("@/components/MermaidPreview", () => ({
  MermaidPreview: () => null,
}));

import { render, screen, act, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement, useState, type ReactElement } from "react";
import { HighlightedCode } from "@/components/HighlightedCode";
import { useCodeEditorOverride } from "@/hooks/useCodeEditorOverride";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_CODE = "%%{init: {'theme': 'base'} }%%\nflowchart TD\n  A --> B";

// Minimal input diagram for ApplyTab — non-empty so effectiveExportCode is computed.
const SAMPLE_INPUT = "flowchart TD\n  A --> B";

// ---------------------------------------------------------------------------
// Minimal test wrapper: mirrors ApplyTab's code mode conditional rendering.
// ---------------------------------------------------------------------------

function CodeModePanel({ code }: { code: string }): ReactElement {
  const { codeEditorOverride, setCodeEditorOverride, effectiveExportCode } =
    useCodeEditorOverride(code);

  if (codeEditorOverride !== null) {
    return createElement(
      "div",
      null,
      createElement("textarea", {
        value: effectiveExportCode,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setCodeEditorOverride(e.target.value),
        "aria-label": "Styled code output — edit before copying",
      }),
      createElement(
        "button",
        {
          title: "Discard edits and reset to computed output",
          onClick: () => setCodeEditorOverride(null),
        },
        "Reset"
      )
    );
  }

  return createElement(
    "div",
    null,
    createElement(HighlightedCode, {
      code: effectiveExportCode,
      "aria-label": "Styled code output",
    }),
    effectiveExportCode
      ? createElement(
          "button",
          {
            title: "Edit the styled code before copying",
            onClick: () => setCodeEditorOverride(effectiveExportCode),
          },
          "Edit"
        )
      : null
  );
}

// ---------------------------------------------------------------------------
// ApplyTab props factory — supplies all required props with safe defaults.
// ---------------------------------------------------------------------------

function buildApplyTabProps(overrides: Record<string, unknown> = {}) {
  return {
    selectedPalette: BRAND_PALETTES[0],
    selectedPaletteId: BRAND_PALETTES[0].id,
    onSelectPalette: vi.fn(),
    customColors: {},
    onColorChange: vi.fn(),
    onResetPalette: vi.fn(),
    onResetColor: vi.fn(),
    hasCustomizations: false,
    inputCode: SAMPLE_INPUT,
    onInputChange: vi.fn(),
    includeMetaComments: false,
    includeBadge: false,
    effectiveThemeName: BRAND_PALETTES[0].name,
    onSwitchTab: vi.fn(),
    onExtractTheme: vi.fn().mockReturnValue(null),
    userPalettes: [],
    onShowToast: vi.fn(),
    recentPaletteIds: [],
    look: "classic" as const,
    onLookChange: vi.fn(),
    fontSize: "14",
    onFontSizeChange: vi.fn(),
    typography: DEFAULT_TYPOGRAPHY,
    rendererTarget: "",
    onRendererTargetChange: vi.fn(),
    lastExampleType: {},
    onRecordExampleType: vi.fn(),
    previewMode: "code" as const,
    onPreviewModeChange: vi.fn(),
    hintResetToken: 0,
    onResetSyntaxHints: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeAll(() => {
  // Suppress happy-dom navigation/not-implemented warnings from hash writes.
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    if (msg.includes("navigation") || msg.includes("Not implemented")) return;
    console.warn("[test error]", ...args);
  });
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// ===========================================================================
// A. HighlightedCode — tabIndex and aria-label
// ===========================================================================

describe("HighlightedCode — keyboard focusability", () => {
  it("non-empty code block has tabindex='0' on the pre element", () => {
    const { container } = render(createElement(HighlightedCode, { code: SAMPLE_CODE }));
    expect(container.querySelector("pre")!.getAttribute("tabindex")).toBe("0");
  });

  it("non-empty pre element has tabIndex property === 0 (reachable by Tab key)", () => {
    const { container } = render(createElement(HighlightedCode, { code: SAMPLE_CODE }));
    expect((container.querySelector("pre") as HTMLElement).tabIndex).toBe(0);
  });

  it("empty code block does not carry tabindex (placeholder is decorative, not interactive)", () => {
    const { container } = render(createElement(HighlightedCode, { code: "" }));
    expect(container.querySelector("pre")!.getAttribute("tabindex")).toBeNull();
  });
});

describe("HighlightedCode — aria-label forwarding", () => {
  it("aria-label prop is set on the pre element when code is non-empty", () => {
    const { container } = render(
      createElement(HighlightedCode, {
        code: SAMPLE_CODE,
        "aria-label": "Styled code output",
      })
    );
    expect(container.querySelector("pre")!.getAttribute("aria-label")).toBe("Styled code output");
  });

  it("aria-label is also set on the pre element when code is empty", () => {
    const { container } = render(
      createElement(HighlightedCode, {
        code: "",
        "aria-label": "Styled code output",
      })
    );
    expect(container.querySelector("pre")!.getAttribute("aria-label")).toBe("Styled code output");
  });
});

// ===========================================================================
// B. CodeModePanel wrapper — Edit / Reset toggle (hook + HighlightedCode)
// ===========================================================================

describe("Code mode wrapper — view mode initial state", () => {
  it("pre is present and textarea is absent on initial mount", () => {
    const { container } = render(createElement(CodeModePanel, { code: SAMPLE_CODE }));
    expect(container.querySelector("pre")).not.toBeNull();
    expect(container.querySelector("textarea")).toBeNull();
  });

  it("Edit button is visible in view mode", () => {
    render(createElement(CodeModePanel, { code: SAMPLE_CODE }));
    expect(screen.getByTitle("Edit the styled code before copying")).not.toBeNull();
  });
});

describe("Code mode wrapper — Edit / Reset toggle", () => {
  it("clicking Edit replaces the pre with a textarea", () => {
    const { container } = render(createElement(CodeModePanel, { code: SAMPLE_CODE }));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    expect(container.querySelector("textarea")).not.toBeNull();
    expect(container.querySelector("pre")).toBeNull();
  });

  it("textarea in edit mode has aria-label 'Styled code output — edit before copying'", () => {
    const { container } = render(createElement(CodeModePanel, { code: SAMPLE_CODE }));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    expect(container.querySelector("textarea")!.getAttribute("aria-label")).toBe(
      "Styled code output — edit before copying"
    );
  });

  it("clicking Reset after Edit restores the pre and removes the textarea", () => {
    const { container } = render(createElement(CodeModePanel, { code: SAMPLE_CODE }));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    act(() => {
      fireEvent.click(screen.getByTitle("Discard edits and reset to computed output"));
    });
    expect(container.querySelector("pre")).not.toBeNull();
    expect(container.querySelector("textarea")).toBeNull();
  });

  it("pre after Reset still carries tabindex='0' (keyboard focus is preserved)", () => {
    const { container } = render(createElement(CodeModePanel, { code: SAMPLE_CODE }));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    act(() => {
      fireEvent.click(screen.getByTitle("Discard edits and reset to computed output"));
    });
    expect(container.querySelector("pre")!.getAttribute("tabindex")).toBe("0");
  });
});

// ===========================================================================
// C. ApplyTab integration — real component rendered with previewMode="code"
// ===========================================================================

describe("ApplyTab code mode — view state (real component)", () => {
  it("renders a focusable <pre> with aria-label='Styled code output' in code mode", () => {
    const { container } = render(createElement(ApplyTab, buildApplyTabProps()));
    const pre = container.querySelector("pre[aria-label='Styled code output']");
    expect(pre).not.toBeNull();
    expect((pre as HTMLElement).getAttribute("tabindex")).toBe("0");
  });

  it("Edit button is present when in view mode with non-empty code", () => {
    render(createElement(ApplyTab, buildApplyTabProps()));
    // Button has title "Edit the styled code before copying"
    expect(screen.getByTitle("Edit the styled code before copying")).not.toBeNull();
  });

  it("textarea is absent from DOM in initial view mode", () => {
    const { container } = render(createElement(ApplyTab, buildApplyTabProps()));
    // No textarea with the edit aria-label should be present before clicking Edit
    expect(
      container.querySelector("textarea[aria-label='Styled code output — edit before copying']")
    ).toBeNull();
  });
});

describe("ApplyTab code mode — Edit button in real component", () => {
  it("clicking Edit shows a textarea with aria-label='Styled code output — edit before copying'", () => {
    const { container } = render(createElement(ApplyTab, buildApplyTabProps()));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    const ta = container.querySelector(
      "textarea[aria-label='Styled code output — edit before copying']"
    );
    expect(ta).not.toBeNull();
  });

  it("clicking Edit removes the highlighted <pre> from the DOM", () => {
    const { container } = render(createElement(ApplyTab, buildApplyTabProps()));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    expect(container.querySelector("pre[aria-label='Styled code output']")).toBeNull();
  });

  it("Reset button appears after clicking Edit", () => {
    render(createElement(ApplyTab, buildApplyTabProps()));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    expect(screen.getByTitle("Discard edits and reset to computed output")).not.toBeNull();
  });
});

describe("ApplyTab code mode — Reset button in real component", () => {
  it("clicking Reset restores the highlighted <pre> and removes the textarea", () => {
    const { container } = render(createElement(ApplyTab, buildApplyTabProps()));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    expect(
      container.querySelector("textarea[aria-label='Styled code output — edit before copying']")
    ).not.toBeNull();

    act(() => {
      fireEvent.click(screen.getByTitle("Discard edits and reset to computed output"));
    });
    const pre = container.querySelector("pre[aria-label='Styled code output']");
    expect(pre).not.toBeNull();
    expect(
      container.querySelector("textarea[aria-label='Styled code output — edit before copying']")
    ).toBeNull();
  });

  it("restored <pre> still has tabindex='0' after Reset (remains keyboard-focusable)", () => {
    const { container } = render(createElement(ApplyTab, buildApplyTabProps()));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    act(() => {
      fireEvent.click(screen.getByTitle("Discard edits and reset to computed output"));
    });
    const pre = container.querySelector("pre[aria-label='Styled code output']");
    expect((pre as HTMLElement).getAttribute("tabindex")).toBe("0");
  });
});

// ===========================================================================
// D. Keyboard bindings — Enter to edit, Escape to cancel (Task #331)
// ===========================================================================

describe("ApplyTab code mode — Enter key activates edit mode", () => {
  it("pressing Enter on the focused <pre> replaces it with a textarea", () => {
    const { container } = render(createElement(ApplyTab, buildApplyTabProps()));
    const pre = container.querySelector("pre[aria-label='Styled code output']") as HTMLElement;
    act(() => {
      fireEvent.keyDown(pre, { key: "Enter" });
    });
    expect(
      container.querySelector("textarea[aria-label='Styled code output — edit before copying']")
    ).not.toBeNull();
    expect(container.querySelector("pre[aria-label='Styled code output']")).toBeNull();
  });

  it("pressing a non-Enter key on the <pre> does not activate edit mode", () => {
    const { container } = render(createElement(ApplyTab, buildApplyTabProps()));
    const pre = container.querySelector("pre[aria-label='Styled code output']") as HTMLElement;
    act(() => {
      fireEvent.keyDown(pre, { key: "Space" });
    });
    expect(container.querySelector("pre[aria-label='Styled code output']")).not.toBeNull();
    expect(
      container.querySelector("textarea[aria-label='Styled code output — edit before copying']")
    ).toBeNull();
  });
});

describe("ApplyTab code mode — Escape key cancels edit mode", () => {
  it("pressing Escape on the textarea restores the <pre> and removes the textarea", () => {
    const { container } = render(createElement(ApplyTab, buildApplyTabProps()));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    const textarea = container.querySelector(
      "textarea[aria-label='Styled code output — edit before copying']"
    ) as HTMLElement;
    expect(textarea).not.toBeNull();
    act(() => {
      fireEvent.keyDown(textarea, { key: "Escape" });
    });
    expect(container.querySelector("pre[aria-label='Styled code output']")).not.toBeNull();
    expect(
      container.querySelector("textarea[aria-label='Styled code output — edit before copying']")
    ).toBeNull();
  });

  it("pressing a non-Escape key on the textarea does not exit edit mode", () => {
    const { container } = render(createElement(ApplyTab, buildApplyTabProps()));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    const textarea = container.querySelector(
      "textarea[aria-label='Styled code output — edit before copying']"
    ) as HTMLElement;
    act(() => {
      fireEvent.keyDown(textarea, { key: "Enter" });
    });
    expect(
      container.querySelector("textarea[aria-label='Styled code output — edit before copying']")
    ).not.toBeNull();
    expect(container.querySelector("pre[aria-label='Styled code output']")).toBeNull();
  });
});

// ===========================================================================
// E. Preview-mode tablist — ArrowLeft/ArrowRight/Home/End keyboard navigation
// ===========================================================================

// Controlled wrapper: holds previewMode in state so keyboard navigation
// actually re-renders the component when onPreviewModeChange is called.
function ControlledApplyTab({
  initial = "original",
}: {
  initial?: "original" | "themed" | "diff" | "code";
}): ReactElement {
  const [mode, setMode] = useState<"original" | "themed" | "diff" | "code">(initial);
  return createElement(
    ApplyTab,
    buildApplyTabProps({ previewMode: mode, onPreviewModeChange: setMode })
  );
}

function renderWithMode(initial: "original" | "themed" | "diff" | "code" = "original") {
  const result = render(createElement(ControlledApplyTab, { initial }));
  const tablist = result.container.querySelector('[role="tablist"]') as HTMLElement;
  function tab(mode: string) {
    return result.container.querySelector(`[data-preview-mode="${mode}"]`) as HTMLElement;
  }
  return { ...result, tablist, tab };
}

describe("ApplyTab preview tablist — initial roving tabIndex", () => {
  it("the active tab ('original') has tabIndex=0", () => {
    const { tab } = renderWithMode("original");
    expect(tab("original").getAttribute("tabindex")).toBe("0");
  });

  it("inactive tabs have tabIndex=-1", () => {
    const { tab } = renderWithMode("original");
    expect(tab("themed").getAttribute("tabindex")).toBe("-1");
    expect(tab("diff").getAttribute("tabindex")).toBe("-1");
    expect(tab("code").getAttribute("tabindex")).toBe("-1");
  });

  it("the active tab has aria-selected='true'", () => {
    const { tab } = renderWithMode("original");
    expect(tab("original").getAttribute("aria-selected")).toBe("true");
  });

  it("inactive tabs have aria-selected='false'", () => {
    const { tab } = renderWithMode("original");
    expect(tab("themed").getAttribute("aria-selected")).toBe("false");
    expect(tab("diff").getAttribute("aria-selected")).toBe("false");
    expect(tab("code").getAttribute("aria-selected")).toBe("false");
  });
});

describe("ApplyTab preview tablist — ArrowRight navigation", () => {
  it("ArrowRight from 'original' activates 'themed'", () => {
    const { tablist, tab } = renderWithMode("original");
    act(() => {
      fireEvent.keyDown(tablist, { key: "ArrowRight" });
    });
    expect(tab("themed").getAttribute("aria-selected")).toBe("true");
    expect(tab("original").getAttribute("aria-selected")).toBe("false");
  });

  it("ArrowRight from 'themed' activates 'diff'", () => {
    const { tablist, tab } = renderWithMode("themed");
    act(() => {
      fireEvent.keyDown(tablist, { key: "ArrowRight" });
    });
    expect(tab("diff").getAttribute("aria-selected")).toBe("true");
  });

  it("ArrowRight from 'diff' activates 'code'", () => {
    const { tablist, tab } = renderWithMode("diff");
    act(() => {
      fireEvent.keyDown(tablist, { key: "ArrowRight" });
    });
    expect(tab("code").getAttribute("aria-selected")).toBe("true");
  });

  it("ArrowRight from 'code' wraps around to 'original'", () => {
    const { tablist, tab } = renderWithMode("code");
    act(() => {
      fireEvent.keyDown(tablist, { key: "ArrowRight" });
    });
    expect(tab("original").getAttribute("aria-selected")).toBe("true");
    expect(tab("code").getAttribute("aria-selected")).toBe("false");
  });
});

describe("ApplyTab preview tablist — ArrowLeft navigation", () => {
  it("ArrowLeft from 'original' wraps around to 'code'", () => {
    const { tablist, tab } = renderWithMode("original");
    act(() => {
      fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    });
    expect(tab("code").getAttribute("aria-selected")).toBe("true");
    expect(tab("original").getAttribute("aria-selected")).toBe("false");
  });

  it("ArrowLeft from 'code' activates 'diff'", () => {
    const { tablist, tab } = renderWithMode("code");
    act(() => {
      fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    });
    expect(tab("diff").getAttribute("aria-selected")).toBe("true");
  });

  it("ArrowLeft from 'diff' activates 'themed'", () => {
    const { tablist, tab } = renderWithMode("diff");
    act(() => {
      fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    });
    expect(tab("themed").getAttribute("aria-selected")).toBe("true");
  });

  it("ArrowLeft from 'themed' activates 'original'", () => {
    const { tablist, tab } = renderWithMode("themed");
    act(() => {
      fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    });
    expect(tab("original").getAttribute("aria-selected")).toBe("true");
  });
});

describe("ApplyTab preview tablist — Home and End keys", () => {
  it("Home from 'code' jumps to 'original'", () => {
    const { tablist, tab } = renderWithMode("code");
    act(() => {
      fireEvent.keyDown(tablist, { key: "Home" });
    });
    expect(tab("original").getAttribute("aria-selected")).toBe("true");
    expect(tab("code").getAttribute("aria-selected")).toBe("false");
  });

  it("Home from 'diff' jumps to 'original'", () => {
    const { tablist, tab } = renderWithMode("diff");
    act(() => {
      fireEvent.keyDown(tablist, { key: "Home" });
    });
    expect(tab("original").getAttribute("aria-selected")).toBe("true");
  });

  it("End from 'original' jumps to 'code'", () => {
    const { tablist, tab } = renderWithMode("original");
    act(() => {
      fireEvent.keyDown(tablist, { key: "End" });
    });
    expect(tab("code").getAttribute("aria-selected")).toBe("true");
    expect(tab("original").getAttribute("aria-selected")).toBe("false");
  });

  it("End from 'themed' jumps to 'code'", () => {
    const { tablist, tab } = renderWithMode("themed");
    act(() => {
      fireEvent.keyDown(tablist, { key: "End" });
    });
    expect(tab("code").getAttribute("aria-selected")).toBe("true");
  });

  it("Home on already-active 'original' keeps it active", () => {
    const { tablist, tab } = renderWithMode("original");
    act(() => {
      fireEvent.keyDown(tablist, { key: "Home" });
    });
    expect(tab("original").getAttribute("aria-selected")).toBe("true");
  });

  it("End on already-active 'code' keeps it active", () => {
    const { tablist, tab } = renderWithMode("code");
    act(() => {
      fireEvent.keyDown(tablist, { key: "End" });
    });
    expect(tab("code").getAttribute("aria-selected")).toBe("true");
  });
});

describe("ApplyTab preview tablist — roving tabIndex updates after navigation", () => {
  it("after ArrowRight to 'themed', tabIndex=0 on 'themed' and -1 on others", () => {
    const { tablist, tab } = renderWithMode("original");
    act(() => {
      fireEvent.keyDown(tablist, { key: "ArrowRight" });
    });
    expect(tab("themed").getAttribute("tabindex")).toBe("0");
    expect(tab("original").getAttribute("tabindex")).toBe("-1");
    expect(tab("diff").getAttribute("tabindex")).toBe("-1");
    expect(tab("code").getAttribute("tabindex")).toBe("-1");
  });

  it("after End to 'code', tabIndex=0 on 'code' and -1 on others", () => {
    const { tablist, tab } = renderWithMode("original");
    act(() => {
      fireEvent.keyDown(tablist, { key: "End" });
    });
    expect(tab("code").getAttribute("tabindex")).toBe("0");
    expect(tab("original").getAttribute("tabindex")).toBe("-1");
    expect(tab("themed").getAttribute("tabindex")).toBe("-1");
    expect(tab("diff").getAttribute("tabindex")).toBe("-1");
  });
});

describe("ApplyTab preview tablist — non-navigation keys have no effect", () => {
  it("pressing Tab does not change the active mode", () => {
    const { tablist, tab } = renderWithMode("original");
    act(() => {
      fireEvent.keyDown(tablist, { key: "Tab" });
    });
    expect(tab("original").getAttribute("aria-selected")).toBe("true");
    expect(tab("themed").getAttribute("aria-selected")).toBe("false");
  });

  it("pressing Space does not change the active mode via the tablist handler", () => {
    const { tablist, tab } = renderWithMode("original");
    act(() => {
      fireEvent.keyDown(tablist, { key: " " });
    });
    expect(tab("original").getAttribute("aria-selected")).toBe("true");
  });
});
