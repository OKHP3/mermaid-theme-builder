import type { ThemeColor } from "./palettes";
import { BRAND_PALETTES } from "./palettes";
import type { MermaidLook } from "./theme-engine";
import { DEFAULT_TYPOGRAPHY, type TypographySettings } from "./typography";

export const MY_THEME_SLOT_IDS = ["my-theme-1", "my-theme-2", "my-theme-3"] as const;
export type MyThemeSlotId = (typeof MY_THEME_SLOT_IDS)[number];

export interface MyThemeSlot {
  id: MyThemeSlotId;
  name: string;
  colors: ThemeColor[];
  look: MermaidLook;
  fontSize: string;
  typography: TypographySettings;
}

export function defaultSlotName(n: 1 | 2 | 3): string {
  return `My Theme ${n}`;
}

export function slotDisplayName(id: string): string {
  const n = (MY_THEME_SLOT_IDS as readonly string[]).indexOf(id);
  return n >= 0 ? `My Theme ${n + 1}` : "My Theme";
}

export function createDefaultMyThemeSlot(n: 1 | 2 | 3, sourceColors?: ThemeColor[]): MyThemeSlot {
  const base = sourceColors ?? BRAND_PALETTES[0].colors;
  return {
    id: `my-theme-${n}` as MyThemeSlotId,
    name: defaultSlotName(n),
    colors: base.map((c) => ({ ...c })),
    look: "classic",
    fontSize: "",
    typography: {
      diagramTitle: { ...DEFAULT_TYPOGRAPHY.diagramTitle },
      subgraphTitle: { ...DEFAULT_TYPOGRAPHY.subgraphTitle },
      nestedSubgraphTitle: { ...DEFAULT_TYPOGRAPHY.nestedSubgraphTitle },
      nodeLabel: { ...DEFAULT_TYPOGRAPHY.nodeLabel },
      edgeLabel: { ...DEFAULT_TYPOGRAPHY.edgeLabel },
    },
  };
}

export function nextSlotNumber(slots: MyThemeSlot[]): (1 | 2 | 3) | null {
  if (slots.length >= 3) return null;
  const usedIds = new Set(slots.map((s) => s.id));
  for (const n of [1, 2, 3] as const) {
    if (!usedIds.has(`my-theme-${n}` as MyThemeSlotId)) return n;
  }
  return null;
}

export function isMyThemeSlotId(id: unknown): id is MyThemeSlotId {
  return typeof id === "string" && (MY_THEME_SLOT_IDS as readonly string[]).includes(id);
}
