/**
 * Fuzzy class-name matching for the unrecognized-class warning.
 *
 * Provides a pure Levenshtein-based utility that suggests the closest defined
 * classDef name(s) when a :::unknown token is detected in the diagram source.
 */

/**
 * Computes the Levenshtein edit distance between two strings.
 * Case-sensitive; operates on characters (not code-points).
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row rolling array — O(n) space.
  const row: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, row[j], row[j - 1]);
      prev = tmp;
    }
  }

  return row[n];
}

/**
 * Returns the closest defined class names to `unknown` within edit distance ≤ 2.
 *
 * Only names at the minimum observed distance are returned (no mixing of
 * distance-1 and distance-2 results). Results are sorted alphabetically within
 * that tier. At most 3 suggestions are returned.
 *
 * Returns an empty array when no defined name is within distance 2.
 */
export function suggestClassMatch(unknown: string, defined: readonly string[]): string[] {
  if (defined.length === 0) return [];

  const MAX_DISTANCE = 2;
  const MAX_SUGGESTIONS = 3;

  const candidates: { name: string; dist: number }[] = [];

  for (const name of defined) {
    const dist = levenshtein(unknown, name);
    if (dist <= MAX_DISTANCE) {
      candidates.push({ name, dist });
    }
  }

  if (candidates.length === 0) return [];

  const minDist = Math.min(...candidates.map((c) => c.dist));
  return candidates
    .filter((c) => c.dist === minDist)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, MAX_SUGGESTIONS)
    .map((c) => c.name);
}
