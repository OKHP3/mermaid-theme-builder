import { BUILTIN_PALETTES, BRAND_PALETTES } from "@/lib/palettes";
import {
  completeThemeToPalette,
  paletteToCompleteTheme,
  THEME_LIBRARY_KEY,
  type ThemeLibrary,
} from "@/lib/theme-library";

/** Compatibility view for pre-library behavior tests. Reads only the new key.
 * Dedicated migration tests assert the envelope and unchanged legacy bytes.
 */
export function persistedWorkspaceView(): Record<string, unknown> {
  const raw = localStorage.getItem(THEME_LIBRARY_KEY);
  if (!raw) throw new Error("The new library has not been written yet.");
  const state: ThemeLibrary = JSON.parse(raw);
  const session = state.editorSession;
  const activeId = session.activeThemeId ?? session.selectedPaletteId;
  const theme =
    state.drafts.find((item) => item.id === activeId) ??
    state.themes.find((item) => item.id === activeId) ??
    paletteToCompleteTheme(
      BUILTIN_PALETTES.find((palette) => palette.id === activeId) ?? BRAND_PALETTES[0]
    );
  const records = [
    ...state.themes,
    ...state.drafts.filter((draft) => !state.themes.some((saved) => saved.id === draft.id)),
  ];
  return {
    ...session.preferences,
    ...theme,
    inputCode: session.inputCode,
    selectedPaletteId: session.activeThemeId ?? session.selectedPaletteId,
    activeMyThemeSlotId: session.activeThemeId,
    myThemeSlots: records,
    userPalettes: records.map(completeThemeToPalette),
    customColors: Object.fromEntries(
      state.drafts
        .filter((draft) => {
          const baseline =
            state.themes.find((saved) => saved.id === draft.id)?.colors ??
            BUILTIN_PALETTES.find((palette) => palette.id === draft.id)?.colors ??
            BRAND_PALETTES[0].colors;
          return draft.colors.some(
            (color) => baseline.find((entry) => entry.key === color.key)?.value !== color.value
          );
        })
        .map((draft) => [draft.id, draft.colors])
    ),
  };
}
