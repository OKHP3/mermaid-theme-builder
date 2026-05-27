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
