/**
 * Extracts Mermaid node-class names referenced via the `:::className` syntax
 * from a diagram source string.
 *
 * Mirrors the regex used in ReferenceTab.tsx so the detection logic is
 * testable without importing a React component.
 *
 * Notes on current behavior (intentional, not bugs):
 *  - `\w` matches [a-zA-Z0-9_] only — hyphens stop the match, so
 *    `:::my-class` captures only `"my"`.
 *  - `%%` comment lines are NOT excluded — `%% :::primary` will still
 *    yield `"primary"`.
 */
export function extractUsedClasses(code: string): ReadonlySet<string> {
  if (!code) return new Set();
  const matches = code.matchAll(/:::(\w+)/g);
  return new Set(Array.from(matches, (m) => m[1]));
}

/**
 * Replaces every whole-token occurrence of `:::typo` with `:::suggestion`
 * in the given diagram source string.
 *
 * Uses a word-boundary anchor (`\b`) after the typo name so that a shorter
 * token (e.g. `:::prim`) is never confused with a longer one that shares the
 * same prefix (e.g. `:::primary`). Only exact token matches are replaced.
 *
 * Special regex characters in `typo` are escaped before pattern construction.
 */
export function applyClassFix(code: string, typo: string, suggestion: string): string {
  const escaped = typo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`:::${escaped}\\b`, "g");
  return code.replace(re, `:::${suggestion}`);
}
