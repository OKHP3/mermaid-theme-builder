// @vitest-environment happy-dom

/**
 * Tests for the styled code output panel (Task #35 / Task #44).
 *
 * Uses @testing-library/react renderHook + act to exercise the real hook
 * (useCodeEditorOverride) that backs the code-editor panel in ApplyTab.
 *
 * Behaviors covered:
 *   1. effectiveExportCode equals exportCode when override is null (initial state).
 *   2. effectiveExportCode returns the override string after setCodeEditorOverride.
 *   3. Override is cleared when exportCode changes (useEffect dependency).
 *   4. copy/download-path: effectiveExportCode uses edited text when override is set,
 *      and reverts to fresh exportCode once the override is cleared.
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCodeEditorOverride } from "@/hooks/useCodeEditorOverride";
import { generateThemedCode, type ExportOptions } from "@/lib/themeEngine";
import { BRAND_PALETTES } from "@/lib/palettes";

const paletteA = BRAND_PALETTES[0];
const paletteB = BRAND_PALETTES[1];

const BASE_OPTIONS: ExportOptions = {
  palette: paletteA,
  diagramFamily: "flowchart",
  includeMetaComments: false,
  includeBadge: false,
};

const DIAGRAM = "flowchart TD\n  A --> B";

// Pre-compute export codes for the two palettes used in tests.
const exportCodeA = generateThemedCode(DIAGRAM, BASE_OPTIONS);
const exportCodeB = generateThemedCode(DIAGRAM, { ...BASE_OPTIONS, palette: paletteB });

// ---------------------------------------------------------------------------
// 1. Initial state: effectiveExportCode equals the prop exportCode
// ---------------------------------------------------------------------------
describe("useCodeEditorOverride — initial state", () => {
  it("effectiveExportCode equals exportCode when override is null", () => {
    const { result } = renderHook(() => useCodeEditorOverride(exportCodeA));

    expect(result.current.codeEditorOverride).toBeNull();
    expect(result.current.effectiveExportCode).toBe(exportCodeA);
  });

  it("exposes a setCodeEditorOverride setter", () => {
    const { result } = renderHook(() => useCodeEditorOverride(exportCodeA));
    expect(typeof result.current.setCodeEditorOverride).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// 2. Override takes precedence over exportCode when set
// ---------------------------------------------------------------------------
describe("useCodeEditorOverride — override set by user edit", () => {
  it("effectiveExportCode returns the override when one is set", () => {
    const { result } = renderHook(() => useCodeEditorOverride(exportCodeA));

    act(() => {
      result.current.setCodeEditorOverride("user edited content");
    });

    expect(result.current.codeEditorOverride).toBe("user edited content");
    expect(result.current.effectiveExportCode).toBe("user edited content");
  });

  it("an empty-string override is still used (explicit edit, not absence)", () => {
    const { result } = renderHook(() => useCodeEditorOverride(exportCodeA));

    act(() => {
      result.current.setCodeEditorOverride("");
    });

    expect(result.current.effectiveExportCode).toBe("");
  });

  it("override replaces the original exportCode for the copy/download path", () => {
    const { result } = renderHook(() => useCodeEditorOverride(exportCodeA));

    const editedText = "flowchart TD\n  A --> B --> C  %% manually added";
    act(() => {
      result.current.setCodeEditorOverride(editedText);
    });

    expect(result.current.effectiveExportCode).toBe(editedText);
    expect(result.current.effectiveExportCode).not.toBe(exportCodeA);
  });
});

// ---------------------------------------------------------------------------
// 3. Override is cleared when exportCode changes (useEffect dependency)
//    Mirrors: useEffect(() => { setCodeEditorOverride(null); }, [exportCode]);
// ---------------------------------------------------------------------------
describe("useCodeEditorOverride — override reset on exportCode change", () => {
  it("override is cleared when exportCode prop changes", () => {
    let currentExportCode = exportCodeA;
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(currentExportCode),
    );

    // Set an override (user edits the panel).
    act(() => {
      result.current.setCodeEditorOverride("stale user edit");
    });
    expect(result.current.codeEditorOverride).toBe("stale user edit");

    // Simulate a palette switch: exportCode changes → re-render with new value.
    currentExportCode = exportCodeB;
    rerender();

    expect(result.current.codeEditorOverride).toBeNull();
    expect(result.current.effectiveExportCode).toBe(exportCodeB);
  });

  it("effectiveExportCode reflects fresh exportCode after palette change clears override", () => {
    let currentExportCode = exportCodeA;
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(currentExportCode),
    );

    act(() => {
      result.current.setCodeEditorOverride("overridden by user");
    });

    // Switch to palette B — exportCode changes, useEffect fires, override clears.
    currentExportCode = exportCodeB;
    rerender();

    // After reset the user sees palette B's fresh output, not the stale override.
    expect(result.current.effectiveExportCode).toBe(exportCodeB);
    expect(result.current.effectiveExportCode).not.toBe("overridden by user");
  });

  it("override is NOT cleared when exportCode stays the same", () => {
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(exportCodeA),
    );

    act(() => {
      result.current.setCodeEditorOverride("still valid edit");
    });

    // Re-render with the same exportCode — override must be preserved.
    rerender();

    expect(result.current.codeEditorOverride).toBe("still valid edit");
    expect(result.current.effectiveExportCode).toBe("still valid edit");
  });

  it("copy/download path uses stale override until a new exportCode is produced", () => {
    let currentExportCode = exportCodeA;
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(currentExportCode),
    );

    const userEdit = "manually tweaked diagram";
    act(() => {
      result.current.setCodeEditorOverride(userEdit);
    });

    // Still on palette A — copy should use the edited text.
    expect(result.current.effectiveExportCode).toBe(userEdit);

    // Switch palette → override clears → copy now uses fresh exportCode.
    currentExportCode = exportCodeB;
    rerender();
    expect(result.current.effectiveExportCode).toBe(exportCodeB);
  });
});
