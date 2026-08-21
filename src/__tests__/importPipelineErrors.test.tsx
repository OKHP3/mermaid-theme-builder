// @vitest-environment happy-dom

/**
 * Integration tests confirming that the catch block inside handleFileChosen
 * (src/pages/tabs/ComposeTab.tsx ~line 581-584) routes through
 * formatImportError (src/lib/importErrorFormat.tsx), not a plain-string
 * fallback.
 *
 * The unit tests in src/__tests__/formatImportError.test.tsx prove the
 * formatter shapes messages correctly. This file proves the catch block
 * actually calls it — a future refactor that bypasses the formatter would
 * cause these tests to fail even though the formatter's own tests still pass.
 */

import { describe, it, expect, vi } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";

// ── Props factory ────────────────────────────────────────────────────────────

type ComposeTabProps = Parameters<typeof ComposeTab>[0];

function makeProps(overrides: Partial<ComposeTabProps> = {}): ComposeTabProps {
  const palette = BRAND_PALETTES[0];
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
    onNavigateToParityMatrix: noop,
    importDiagnostics: null,
    onImportDiagnosticsChange: noop,
    ...overrides,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Render ComposeTab and return the palette-import file input element.
 *
 * ComposeTab renders multiple file inputs (its own and those of sub-components
 * such as PaletteSelectorBar). The correct input is identified by its aria-label
 * so the wrong handler is not triggered.
 */
function renderComposeTab(overrides: Partial<ComposeTabProps> = {}) {
  const { container } = render(createElement(ComposeTab, makeProps(overrides)));
  const input = container.querySelector(
    'input[aria-label="Import palette JSON file"]'
  ) as HTMLInputElement;
  return { container, input };
}

/**
 * Inject a duck-typed mock file into the input's FileList and fire a change
 * event so React calls handleFileChosen with the mock as e.target.files[0].
 */
function triggerFileChange(input: HTMLInputElement, mockFile: { text: () => Promise<string> }) {
  Object.defineProperty(input, "files", {
    value: [mockFile],
    configurable: true,
  });
  fireEvent.change(input);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("handleFileChosen catch block — formatImportError wiring", () => {
  it("passes a ReactNode with a <code> field name to onShowToast when file.text() rejects with a field-pattern error", async () => {
    const onShowToast = vi.fn();
    const { input } = renderComposeTab({ onShowToast });

    // Reject with the field-pattern message that formatImportError enriches.
    // The catch block at src/pages/tabs/ComposeTab.tsx ~line 581-584 builds:
    //   formatImportError(`Import failed: ${err.message}`)
    // which returns a ReactNode fragment for this pattern.
    const mockFile = {
      text: () => Promise.reject(new Error("Field 'version' must be a string, got number.")),
    };
    triggerFileChange(input, mockFile);

    await waitFor(() => expect(onShowToast).toHaveBeenCalledOnce());

    const arg: ReactNode = onShowToast.mock.calls[0][0];

    // Must not be a plain string — formatImportError returned a fragment.
    expect(typeof arg).not.toBe("string");

    // Render the ReactNode and assert the field name is in a <code> element.
    const { container: toastDom } = render(<>{arg}</>);
    const code = toastDom.querySelector("code");
    expect(code).not.toBeNull();
    expect(code!.textContent).toBe("version");
    expect(toastDom.textContent).toContain("Import failed:");
    expect(toastDom.textContent).toContain("must be a string, got number.");
  });

  it("passes a plain string to onShowToast when file.text() rejects with a non-field-pattern error", async () => {
    const onShowToast = vi.fn();
    const { input } = renderComposeTab({ onShowToast });

    // A generic message has no field pattern — formatImportError returns it
    // unchanged as a plain string.
    const mockFile = {
      text: () => Promise.reject(new Error("Could not read file.")),
    };
    triggerFileChange(input, mockFile);

    await waitFor(() => expect(onShowToast).toHaveBeenCalledOnce());

    const arg: ReactNode = onShowToast.mock.calls[0][0];

    expect(typeof arg).toBe("string");
    expect(arg as string).toBe("Import failed: Could not read file.");
  });
});
