import type { DiagramFamily } from "@/data/mermaid-capabilities";
import { HINTS } from "@/lib/family-syntax-hints-data";

export type ClassDefStatus = "yes" | "no" | "limited";

export interface FamilySyntaxHint {
  family: DiagramFamily;
  keyIdiom: string;
  classDefStatus: ClassDefStatus;
  themingNote: string;
}

// ---------------------------------------------------------------------------
// Module-load integrity guards
// ---------------------------------------------------------------------------

/**
 * Throw at module load time if any family key appears more than once in HINTS.
 *
 * A duplicate introduced while adding a new diagram type surfaces immediately
 * in the browser console and in any script that imports this module — rather
 * than only when the test suite runs. Analogous to assertNoDuplicateIds() in
 * examples-filter.ts.
 */
(function assertNoDuplicateFamilyKeys() {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const hint of HINTS) {
    if (seen.has(hint.family)) duplicates.push(hint.family);
    seen.add(hint.family);
  }
  if (duplicates.length > 0) {
    throw new Error(
      `family-syntax-hints: duplicate family key(s) found — ${duplicates.join(", ")}. ` +
        `Every FamilySyntaxHint must have a unique family key.`
    );
  }
})();

/**
 * Total number of registered diagram families in HINTS.
 *
 * Exported so test count guards can derive their expected value directly from
 * the module rather than maintaining a parallel list length. This makes the
 * count guard independent of the test-local ALL_HINT_FAMILIES snapshot array.
 */
export const HINT_FAMILY_COUNT = HINTS.length;

const HINT_MAP = new Map<DiagramFamily, FamilySyntaxHint>(HINTS.map((h) => [h.family, h]));

export function getFamilySyntaxHint(family: DiagramFamily): FamilySyntaxHint | null {
  return HINT_MAP.get(family) ?? null;
}

/**
 * Returns a shallow copy of the full HINTS registry array.
 *
 * Exported so tests can assert count-based guards independently of the
 * per-family snapshot tests — if an entry is deleted from HINTS the
 * snapshot test for that family silently disappears, but a count guard
 * against this function will still fail.
 */
export function getAllFamilySyntaxHints(): FamilySyntaxHint[] {
  return [...HINTS];
}

const STORAGE_PREFIX = "mtb.hint-dismissed.";

function storageKey(family: DiagramFamily): string {
  return `${STORAGE_PREFIX}${family}`;
}

export function isHintDismissed(family: DiagramFamily): boolean {
  try {
    return window.localStorage.getItem(storageKey(family)) === "1";
  } catch {
    return false;
  }
}

export function dismissHint(family: DiagramFamily): void {
  try {
    window.localStorage.setItem(storageKey(family), "1");
  } catch {
    // Storage unavailable — dismissal is session-only
  }
}

export function clearAllDismissals(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable — nothing to clear
  }
}
