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
import { generateThemedCode, type ExportOptions } from "@/lib/theme-engine";
import { BRAND_PALETTES } from "@/lib/palettes";
import { splitDiagrams } from "@/lib/diagram-split";

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
    const { result, rerender } = renderHook(() => useCodeEditorOverride(currentExportCode));

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
    const { result, rerender } = renderHook(() => useCodeEditorOverride(currentExportCode));

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
    const { result, rerender } = renderHook(() => useCodeEditorOverride(exportCodeA));

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
    const { result, rerender } = renderHook(() => useCodeEditorOverride(currentExportCode));

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

  it("base code change (e.g. palette switch) clears the override for the current diagram", () => {
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

    // Start on diagram 0 (no activeDiagramIdx arg — defaults to 0).
    let currentExportCode = exportCodeDiagram0;
    const { result, rerender } = renderHook(() => useCodeEditorOverride(currentExportCode));

    // User edits the code panel while viewing diagram 0.
    act(() => {
      result.current.setCodeEditorOverride("stale edit from diagram 0");
    });
    expect(result.current.codeEditorOverride).toBe("stale edit from diagram 0");
    expect(result.current.effectiveExportCode).toBe("stale edit from diagram 0");

    // Simulate a palette/option change: exportCode changes while the diagram
    // index stays the same (idx stays at default 0 throughout this test).
    // This represents any action that causes the base code to change for the
    // currently active diagram — the stored override must be cleared.
    currentExportCode = exportCodeDiagram1;
    rerender();

    // The override is gone because the base code it was derived from changed.
    expect(result.current.codeEditorOverride).toBeNull();
    // The panel now shows the fresh computed output.
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
    const correctedIdx =
      activeDiagramIdx > 0 && activeDiagramIdx >= singleDiagrams.length ? 0 : activeDiagramIdx;
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
      const correctedIdx = staleIdx > 0 && staleIdx >= singleDiagrams.length ? 0 : staleIdx;
      const safeDiagramIdx = Math.min(correctedIdx, singleDiagrams.length - 1);

      // Regardless of which diagram was active before, we land on index 0.
      expect(singleDiagrams[safeDiagramIdx].label).toBe("Diagram 1");
    }
  });

  // -------------------------------------------------------------------------
  // 8. Identical-exportCode edge case: two diagrams whose themed output is
  //    textually identical must NOT bleed edits between each other.
  //
  //    The old implementation only depended on [exportCode], so the useEffect
  //    would not fire when switching between two diagrams that produce the
  //    same string. The fix adds activeDiagramIdx to the dependency array so
  //    the override always resets on an index change regardless of code equality.
  // -------------------------------------------------------------------------
  it("override resets when switching between two diagrams with identical exportCode", () => {
    // Construct two minimal flowcharts that produce the same themed output.
    // Using the same palette and the same source text guarantees identical strings.
    const SAME_SOURCE = "flowchart TD\n  A --> B";
    const opts: ExportOptions = {
      palette: paletteA,
      diagramFamily: "flowchart",
      includeMetaComments: false,
      includeBadge: false,
    };
    const identicalCode = generateThemedCode(SAME_SOURCE, opts);

    // Both diagram slots produce the exact same themed string — confirmed.
    const identicalCodeForDiagram1 = generateThemedCode(SAME_SOURCE, opts);
    expect(identicalCode).toBe(identicalCodeForDiagram1);

    // Simulate the hook as used in ApplyTab: pass exportCode AND activeDiagramIdx.
    let currentExportCode = identicalCode;
    let currentIdx = 0;
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(currentExportCode, currentIdx)
    );

    // User edits the panel while viewing diagram 0.
    act(() => {
      result.current.setCodeEditorOverride("edit on diagram 0");
    });
    expect(result.current.effectiveExportCode).toBe("edit on diagram 0");

    // Switch to diagram 1 — exportCode is identical, but index changes.
    // Diagram 1 has never been edited, so its slot in the per-diagram override
    // map is empty, even though diagram 0's edit is still stored at key 0.
    currentIdx = 1;
    // exportCode stays the same — this is the edge case.
    rerender();

    // Diagram 1 has no stored override, so the panel shows fresh themed output.
    expect(result.current.codeEditorOverride).toBeNull();
    expect(result.current.effectiveExportCode).toBe(identicalCode);
    expect(result.current.effectiveExportCode).not.toBe("edit on diagram 0");
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
    const { result, rerender } = renderHook(() => useCodeEditorOverride(currentExportCode));

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

// ---------------------------------------------------------------------------
// Per-diagram override isolation (Task #200)
//
// useCodeEditorOverride stores overrides keyed by activeDiagramIdx so that
// switching back to a previously edited diagram restores that edit rather than
// showing a blank reset.
// ---------------------------------------------------------------------------
describe("per-diagram override isolation", () => {
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

  it("switching to a new diagram index shows themed output when no override exists there", () => {
    let currentExportCode = exportCodeDiagram0;
    let currentIdx = 0;
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(currentExportCode, currentIdx)
    );

    // User edits diagram 0.
    act(() => {
      result.current.setCodeEditorOverride("edit on diagram 0");
    });
    expect(result.current.effectiveExportCode).toBe("edit on diagram 0");

    // Switch to diagram 1 (no prior edit there).
    currentExportCode = exportCodeDiagram1;
    currentIdx = 1;
    rerender();

    // Diagram 1 has no stored override — panel shows fresh themed output.
    expect(result.current.codeEditorOverride).toBeNull();
    expect(result.current.effectiveExportCode).toBe(exportCodeDiagram1);
  });

  it("switching back to a previously edited diagram restores the stored edit", () => {
    let currentExportCode = exportCodeDiagram0;
    let currentIdx = 0;
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(currentExportCode, currentIdx)
    );

    // User edits diagram 0.
    act(() => {
      result.current.setCodeEditorOverride("edit on diagram 0");
    });

    // Switch to diagram 1 (no edit there).
    currentExportCode = exportCodeDiagram1;
    currentIdx = 1;
    rerender();
    expect(result.current.codeEditorOverride).toBeNull();

    // Switch back to diagram 0 — the stored edit must be restored.
    currentExportCode = exportCodeDiagram0;
    currentIdx = 0;
    rerender();

    expect(result.current.codeEditorOverride).toBe("edit on diagram 0");
    expect(result.current.effectiveExportCode).toBe("edit on diagram 0");
  });

  it("independent edits on two diagrams are stored and restored separately", () => {
    let currentExportCode = exportCodeDiagram0;
    let currentIdx = 0;
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(currentExportCode, currentIdx)
    );

    // Edit diagram 0.
    act(() => {
      result.current.setCodeEditorOverride("edit on diagram 0");
    });

    // Switch to diagram 1, edit it too.
    currentExportCode = exportCodeDiagram1;
    currentIdx = 1;
    rerender();
    act(() => {
      result.current.setCodeEditorOverride("edit on diagram 1");
    });
    expect(result.current.effectiveExportCode).toBe("edit on diagram 1");

    // Switch back to diagram 0 — its own edit is restored.
    currentExportCode = exportCodeDiagram0;
    currentIdx = 0;
    rerender();
    expect(result.current.codeEditorOverride).toBe("edit on diagram 0");
    expect(result.current.effectiveExportCode).toBe("edit on diagram 0");

    // Switch back to diagram 1 — its own edit is restored.
    currentExportCode = exportCodeDiagram1;
    currentIdx = 1;
    rerender();
    expect(result.current.codeEditorOverride).toBe("edit on diagram 1");
    expect(result.current.effectiveExportCode).toBe("edit on diagram 1");
  });

  it("palette change on current diagram clears its override without affecting the other diagram's edit", () => {
    // A different palette applied to diagram 0 produces a different base code.
    const exportCodeDiagram0PaletteB = generateThemedCode(diagrams[0].content, {
      ...optsBase,
      palette: paletteB,
    });

    let currentExportCode = exportCodeDiagram0;
    let currentIdx = 0;
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(currentExportCode, currentIdx)
    );

    // Edit diagram 0.
    act(() => {
      result.current.setCodeEditorOverride("edit on diagram 0");
    });

    // Switch to diagram 1, edit it.
    currentExportCode = exportCodeDiagram1;
    currentIdx = 1;
    rerender();
    act(() => {
      result.current.setCodeEditorOverride("edit on diagram 1");
    });

    // Return to diagram 0, but the palette has changed — base code is different.
    currentExportCode = exportCodeDiagram0PaletteB;
    currentIdx = 0;
    rerender();

    // Diagram 0's override is cleared (the base it was derived from changed).
    expect(result.current.codeEditorOverride).toBeNull();
    expect(result.current.effectiveExportCode).toBe(exportCodeDiagram0PaletteB);

    // Switch to diagram 1 — its edit is still there (palette only changed diagram 0's output).
    currentExportCode = exportCodeDiagram1;
    currentIdx = 1;
    rerender();
    expect(result.current.codeEditorOverride).toBe("edit on diagram 1");
    expect(result.current.effectiveExportCode).toBe("edit on diagram 1");
  });

  it("setCodeEditorOverride(null) clears only the current diagram's override", () => {
    let currentExportCode = exportCodeDiagram0;
    let currentIdx = 0;
    const { result, rerender } = renderHook(() =>
      useCodeEditorOverride(currentExportCode, currentIdx)
    );

    // Edit both diagrams.
    act(() => {
      result.current.setCodeEditorOverride("edit on diagram 0");
    });
    currentExportCode = exportCodeDiagram1;
    currentIdx = 1;
    rerender();
    act(() => {
      result.current.setCodeEditorOverride("edit on diagram 1");
    });

    // Explicitly reset diagram 1 (simulates the Reset button).
    act(() => {
      result.current.setCodeEditorOverride(null);
    });
    expect(result.current.codeEditorOverride).toBeNull();
    expect(result.current.effectiveExportCode).toBe(exportCodeDiagram1);

    // Diagram 0's edit is unaffected.
    currentExportCode = exportCodeDiagram0;
    currentIdx = 0;
    rerender();
    expect(result.current.codeEditorOverride).toBe("edit on diagram 0");
  });
});
