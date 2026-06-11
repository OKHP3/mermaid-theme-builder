import type { ScaffoldFormat } from "./theme-engine";

export const SCAFFOLD_FORMAT_KEY = "mtb-scaffold-format";

/**
 * Validates a raw localStorage value against the known ScaffoldFormat literals.
 * Returns the value as-is when valid, or "both" as the safe default.
 *
 * Exported so both PromptScaffoldModal and ApplyTab share one validator,
 * and so tests can assert preference resolution without touching localStorage.
 */
export function resolveScaffoldFormat(stored: string | null): ScaffoldFormat {
  if (stored === "formatA" || stored === "formatB" || stored === "both") return stored;
  return "both";
}

/**
 * Reads the stored scaffold format preference from localStorage.
 * Returns "both" when not set, unavailable, or unrecognized.
 */
export function readScaffoldFormat(): ScaffoldFormat {
  try {
    return resolveScaffoldFormat(localStorage.getItem(SCAFFOLD_FORMAT_KEY));
  } catch {
    return "both";
  }
}

/**
 * Persists the scaffold format preference to localStorage.
 * Silently ignores storage errors (e.g. private-browsing restrictions).
 */
export function saveScaffoldFormat(format: ScaffoldFormat): void {
  try {
    localStorage.setItem(SCAFFOLD_FORMAT_KEY, format);
  } catch {
    // storage may be unavailable — silently ignore
  }
}
