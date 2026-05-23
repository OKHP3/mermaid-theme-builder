// @vitest-environment happy-dom

/**
 * Tests for the styled code output panel (Task #35 / Task #44 / Task #76).
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
 *   5. Multi-diagram: exportCode differs per diagram index (activeDiagramIdx).
 *   6. Multi-diagram: switching diagram index clears any stale user override.
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCodeEditorOverride } from "@/hooks/useCodeEditorOverride";
import { generateThemedCode, type ExportOptions } from "@/lib/themeEngine";
import { BRAND_PALETTES } from "@/lib/palettes";
import { splitDiagrams } from "@/lib/diagramSplit";

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

// ---------------------------------------------------------------------------
// 5 & 6. Multi-diagram: activeDiagramIdx changes produce distinct exportCodes
//         and switching the active diagram clears any stale user override.
//
//  Mirrors the ApplyTab logic at lines 170-173, 337-342:
//    const diagrams = useMemo(() => splitDiagrams(inputCode), [inputCode]);
//    const activeDiagramCode = diagrams[safeDiagramIdx]?.content ?? inputCode;
//    const exportCode = useMemo(
//      () => generateThemedCode(activeDiagramCode, exportOptions),
//      [activeDiagramCode, exportOptions],
//    );
//    const { ... } = useCodeEditorOverride(exportCode);
// ---------------------------------------------------------------------------
describe("multi-diagram override reset", () => {
  // Two structurally different diagrams pasted as one input buffer.
  const MULTI_INPUT = [
    "flowchart TD",
    "  A --> B",
    "  B --> C",
    "",
    "sequenceDiagram",
    "  Alice->>Bob: Hello",
    "  Bob-->>Alice: Hi",
  ].join("\n");

  const diagrams = splitDiagrams(MULTI_INPUT);

  // Sanity-check the split before the real assertions.
  it("splitDiagrams returns two distinct diagrams from a multi-diagram input", () => {
    expect(diagrams).toHaveLength(2);
    expect(diagrams[0].content).toMatch(/^flowchart/);
    expect(diagrams[1].content).toMatch(/^sequenceDiagram/);
  });

  it("exportCode differs between diagram 0 and diagram 1 for the same palette", () => {
    const opts: ExportOptions = {
      palette: paletteA,
      diagramFamily: "flowchart",
      includeMetaComments: false,
      includeBadge: false,
    };

    const codeForDiagram0 = generateThemedCode(diagrams[0].content, opts);
    const codeForDiagram1 = generateThemedCode(diagrams[1].content, {
      ...opts,
      diagramFamily: "sequence",
    });

    // The two diagrams have different content so their themed outputs must differ.
    expect(codeForDiagram0).not.toBe(codeForDiagram1);
    // Each output embeds its source diagram's first line.
    expect(codeForDiagram0).toContain("flowchart");
    expect(codeForDiagram1).toContain("sequenceDiagram");
  });

  it("switching activeDiagramIdx clears a stale override (mirrors the useEffect path)", () => {
    const optsBase: ExportOptions = {
      palette: paletteA,
      diagramFamily: "flowchart",
      includeMetaComments: false,
      includeBadge: false,
    };

    // Simulate the ApplyTab computation for each diagram index.
    const exportCodeDiagram0 = generateThemedCode(diagrams[0].content, optsBase);
    const exportCodeDiagram1 = generateThemedCode(diagrams[1].content, {
      ...optsBase,
      diagramFamily: "sequence",
    });

    // Start on diagram 0.
    let currentExportCode = exportCodeDiagram0;
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(currentExportCode),
    );

    // User edits the code panel while viewing diagram 0.
    act(() => {
      result.current.setCodeEditorOverride("stale edit from diagram 0");
    });
    expect(result.current.codeEditorOverride).toBe("stale edit from diagram 0");
    expect(result.current.effectiveExportCode).toBe("stale edit from diagram 0");

    // User switches to diagram 1 → activeDiagramCode changes → exportCode changes.
    currentExportCode = exportCodeDiagram1;
    rerender();

    // The stale override from diagram 0 must be gone.
    expect(result.current.codeEditorOverride).toBeNull();
    // The panel now shows diagram 1's fresh themed output.
    expect(result.current.effectiveExportCode).toBe(exportCodeDiagram1);
    expect(result.current.effectiveExportCode).not.toContain("stale edit from diagram 0");
  });

  // -------------------------------------------------------------------------
  // 7. Selector sync: pasting shorter content immediately shows the correct
  //    active label without a stale-index intermediate frame.
  //
  //    In ApplyTab, the guard is now an inline setState during render:
  //      if (activeDiagramIdx > 0 && activeDiagramIdx >= diagrams.length)
  //        setActiveDiagramIdx(0);
  //    React discards the render-in-progress and immediately restarts with
  //    activeDiagramIdx = 0, so no intermediate frame is painted.
  // -------------------------------------------------------------------------
  it("safeDiagramIdx clamps to a valid index the moment content shrinks", () => {
    // User had 2 diagrams, was viewing diagram 1 (index 1).
    const activeDiagramIdx = 1;

    // User pastes single-diagram content — diagrams array now has length 1.
    const singleDiagrams = splitDiagrams("flowchart TD\n  A --> B");
    expect(singleDiagrams).toHaveLength(1);

    // The render-time guard computes the corrected index immediately.
    const correctedIdx = activeDiagramIdx > 0 && activeDiagramIdx >= singleDiagrams.length ? 0 : activeDiagramIdx;
    expect(correctedIdx).toBe(0);

    // safeDiagramIdx (Math.min) also clamps correctly.
    const safeDiagramIdx = Math.min(correctedIdx, singleDiagrams.length - 1);
    expect(safeDiagramIdx).toBe(0);

    // The label shown in the selector is the first diagram's label, not a stale one.
    expect(singleDiagrams[safeDiagramIdx].label).toBe("Diagram 1");
  });

  it("selector label is correct for every valid active index after a shrink", () => {
    // User had 3 diagrams (index 0, 1, 2) and was viewing any of them.
    // After paste, only 1 diagram remains.
    const singleDiagrams = splitDiagrams("flowchart TD\n  A --> B");

    for (const staleIdx of [0, 1, 2]) {
      const correctedIdx =
        staleIdx > 0 && staleIdx >= singleDiagrams.length ? 0 : staleIdx;
      const safeDiagramIdx = Math.min(correctedIdx, singleDiagrams.length - 1);

      // Regardless of which diagram was active before, we land on index 0.
      expect(singleDiagrams[safeDiagramIdx].label).toBe("Diagram 1");
    }
  });

  it("switching back to diagram 0 again clears any override set on diagram 1", () => {
    const optsBase: ExportOptions = {
      palette: paletteA,
      diagramFamily: "flowchart",
      includeMetaComments: false,
      includeBadge: false,
    };

    const exportCodeDiagram0 = generateThemedCode(diagrams[0].content, optsBase);
    const exportCodeDiagram1 = generateThemedCode(diagrams[1].content, {
      ...optsBase,
      diagramFamily: "sequence",
    });

    // Start on diagram 0, no override.
    let currentExportCode = exportCodeDiagram0;
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(currentExportCode),
    );

    // Switch to diagram 1, set an override there.
    currentExportCode = exportCodeDiagram1;
    rerender();
    act(() => {
      result.current.setCodeEditorOverride("edit made on diagram 1");
    });
    expect(result.current.effectiveExportCode).toBe("edit made on diagram 1");

    // Switch back to diagram 0 → exportCode changes again → override must clear.
    currentExportCode = exportCodeDiagram0;
    rerender();

    expect(result.current.codeEditorOverride).toBeNull();
    expect(result.current.effectiveExportCode).toBe(exportCodeDiagram0);
  });
});
