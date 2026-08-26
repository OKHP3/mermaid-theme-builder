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
  /** ISO-8601 timestamp set when the slot is first created. */
  createdAt?: string;
  /** ISO-8601 timestamp updated whenever the slot data changes. */
  updatedAt?: string;
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
  const now = new Date().toISOString();
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
    createdAt: now,
    updatedAt: now,
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

// ── Lifecycle operations (pure — no React state) ─────────────────────────────

/**
 * Duplicate a slot: deep-copy source into the next available slot id, appending
 * " (copy)" to the name.  Returns the new slots array and the new slot's id, or
 * null when all 3 slots are already in use or the source id is not found.
 */
export function duplicateSlot(
  slots: MyThemeSlot[],
  sourceId: string
): { slots: MyThemeSlot[]; newSlotId: MyThemeSlotId } | null {
  const source = slots.find((s) => s.id === sourceId);
  if (!source) return null;
  const num = nextSlotNumber(slots);
  if (num === null) return null;
  const newId = `my-theme-${num}` as MyThemeSlotId;
  const now = new Date().toISOString();
  const copy: MyThemeSlot = {
    id: newId,
    name: `${source.name} (copy)`,
    colors: source.colors.map((c) => ({ ...c })),
    look: source.look,
    fontSize: source.fontSize,
    typography: {
      diagramTitle: { ...source.typography.diagramTitle },
      subgraphTitle: { ...source.typography.subgraphTitle },
      nestedSubgraphTitle: { ...source.typography.nestedSubgraphTitle },
      nodeLabel: { ...source.typography.nodeLabel },
      edgeLabel: { ...source.typography.edgeLabel },
    },
    createdAt: now,
    updatedAt: now,
  };
  return { slots: [...slots, copy], newSlotId: newId };
}

/**
 * Rename a slot without mutating the input array or slot objects.
 * Blank names and unknown slot ids are ignored.
 */
export function renameSlot(slots: MyThemeSlot[], id: string, newName: string): MyThemeSlot[] {
  const trimmed = newName.trim();
  const slot = slots.find((s) => s.id === id);
  if (!slot || !trimmed || trimmed === slot.name) return slots;
  return slots.map((s) => (s.id === id ? { ...s, name: trimmed } : s));
}

/**
 * Move a slot one position toward the start of the array.
 * No-op (returns same reference) if already first or id not found.
 */
export function moveSlotUp(slots: MyThemeSlot[], id: string): MyThemeSlot[] {
  const idx = slots.findIndex((s) => s.id === id);
  if (idx <= 0) return slots;
  const next = [...slots];
  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
  return next;
}

/**
 * Move a slot one position toward the end of the array.
 * No-op (returns same reference) if already last or id not found.
 */
export function moveSlotDown(slots: MyThemeSlot[], id: string): MyThemeSlot[] {
  const idx = slots.findIndex((s) => s.id === id);
  if (idx < 0 || idx >= slots.length - 1) return slots;
  const next = [...slots];
  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  return next;
}
