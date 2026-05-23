import { useState, useEffect } from "react";

/**
 * Manages the code-editor override state for the styled code output panel.
 *
 * - `codeEditorOverride` is null until the user edits the textarea.
 * - `effectiveExportCode` is the override when set, otherwise the
 *   computed `exportCode` from the theme engine.
 * - The override is cleared automatically whenever `exportCode` changes
 *   (palette switch, input edit, option toggle) so the panel always
 *   reflects fresh output after a user action.
 * - The override is also cleared when `activeDiagramIdx` changes, even
 *   if two diagrams happen to produce identical `exportCode` strings.
 *   Without this guard, an edit on diagram N would silently bleed into
 *   diagram M when their themed outputs are textually identical.
 */
export function useCodeEditorOverride(exportCode: string, activeDiagramIdx: number = 0) {
  const [codeEditorOverride, setCodeEditorOverride] = useState<string | null>(null);

  useEffect(() => {
    setCodeEditorOverride(null);
  }, [exportCode, activeDiagramIdx]);

  const effectiveExportCode = codeEditorOverride ?? exportCode;

  return { codeEditorOverride, setCodeEditorOverride, effectiveExportCode };
}
