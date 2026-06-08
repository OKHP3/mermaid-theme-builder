import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Manages the code-editor override state for the styled code output panel.
 *
 * Overrides are stored per diagram index so switching back to a previously
 * edited diagram restores the user's edit instead of showing a blank reset.
 *
 * - `codeEditorOverride` is null for the active diagram until the user edits it.
 * - `effectiveExportCode` is the stored override when one exists for the current
 *   diagram, otherwise the computed `exportCode` from the theme engine.
 * - An override is cleared automatically when the base `exportCode` changes for
 *   that specific diagram (palette switch, input edit, option toggle), so stale
 *   edits based on old base code are never silently preserved.
 * - Switching diagrams (activeDiagramIdx change) restores that diagram's stored
 *   override — or shows fresh themed output if no override exists for it yet.
 * - Two diagrams with textually identical `exportCode` strings do not share
 *   overrides because storage is keyed by index, not by content.
 */
export function useCodeEditorOverride(exportCode: string, activeDiagramIdx: number = 0) {
  // Per-diagram overrides: Map<diagramIdx, userEditText>
  const [overrides, setOverrides] = useState<Map<number, string>>(new Map());

  // Track the last known exportCode per diagram index so we can detect when
  // the base code for the active diagram changes (palette switch, etc.).
  // Using a ref avoids adding prevExportCode to the useEffect dependency array
  // and prevents spurious clears on the initial visit to each diagram.
  const prevExportCodesRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    const prev = prevExportCodesRef.current.get(activeDiagramIdx);
    // Only clear when we have previously seen this diagram AND its base code
    // has changed. First visits (prev === undefined) are left untouched so that
    // a stored override from a prior visit can be restored when returning.
    if (prev !== undefined && prev !== exportCode) {
      setOverrides((existing) => {
        if (!existing.has(activeDiagramIdx)) return existing; // avoid re-render if already clear
        const next = new Map(existing);
        next.delete(activeDiagramIdx);
        return next;
      });
    }
    prevExportCodesRef.current.set(activeDiagramIdx, exportCode);
  }, [exportCode, activeDiagramIdx]);

  const codeEditorOverride = overrides.get(activeDiagramIdx) ?? null;

  const setCodeEditorOverride = useCallback(
    (text: string | null) => {
      setOverrides((existing) => {
        const next = new Map(existing);
        if (text === null) {
          next.delete(activeDiagramIdx);
        } else {
          next.set(activeDiagramIdx, text);
        }
        return next;
      });
    },
    [activeDiagramIdx]
  );

  const effectiveExportCode = codeEditorOverride ?? exportCode;

  return { codeEditorOverride, setCodeEditorOverride, effectiveExportCode };
}
