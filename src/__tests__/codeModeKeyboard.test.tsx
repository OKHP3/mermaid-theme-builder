// @vitest-environment happy-dom

/**
 * Tests for Code tab keyboard accessibility after the textarea-to-pre switch
 * (Task #253).
 *
 * Two layers of coverage:
 *
 *   A. HighlightedCode <pre> focusability and aria-label forwarding.
 *      The <pre> must carry tabIndex=0 so keyboard users can tab into it;
 *      the empty-placeholder path must NOT add a tabIndex (nothing to read).
 *
 *   B. Edit / Reset toggle — a minimal wrapper component that reproduces the
 *      exact conditional rendering in ApplyTab's code mode (lines 962–974):
 *        codeEditorOverride === null  → <HighlightedCode aria-label="…" />  + Edit button
 *        codeEditorOverride !== null  → <textarea aria-label="…" />         + Reset button
 *
 * The wrapper uses the real useCodeEditorOverride hook so the tests exercise the
 * actual production path, not a hand-rolled stub.
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { createElement, type ReactElement } from "react";
import { HighlightedCode } from "@/components/HighlightedCode";
import { useCodeEditorOverride } from "@/hooks/useCodeEditorOverride";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_CODE = "%%{init: {'theme': 'base'} }%%\nflowchart TD\n  A --> B";

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
// Setup / teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
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
// B. Edit / Reset toggle — code mode view/edit switching
// ===========================================================================

describe("Code mode — view mode initial state", () => {
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

describe("Code mode — Edit button switches to textarea", () => {
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

  it("Reset button is visible after clicking Edit", () => {
    render(createElement(CodeModePanel, { code: SAMPLE_CODE }));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    expect(screen.getByTitle("Discard edits and reset to computed output")).not.toBeNull();
  });
});

describe("Code mode — Reset button returns to highlighted pre", () => {
  it("clicking Reset after Edit restores the pre and removes the textarea", () => {
    const { container } = render(createElement(CodeModePanel, { code: SAMPLE_CODE }));
    act(() => {
      fireEvent.click(screen.getByTitle("Edit the styled code before copying"));
    });
    expect(container.querySelector("textarea")).not.toBeNull();

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
