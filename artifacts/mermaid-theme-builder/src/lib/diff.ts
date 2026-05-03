/**
 * Minimal line-level diff using Longest Common Subsequence.
 * Suitable for the small diffs produced by prepending an init directive.
 */

export type DiffOp = "ctx" | "add" | "del";

export interface DiffLine {
  op: DiffOp;
  text: string;
  oldNum?: number;
  newNum?: number;
}

export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split("\n");
  const b = newText.split("\n");
  const m = a.length;
  const n = b.length;

  // LCS table — Uint32Array supports diagrams up to ~65k lines per side.
  const dp: Uint32Array = new Uint32Array((m + 1) * (n + 1));
  const w = n + 1;
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i * w + j] = dp[(i + 1) * w + j + 1] + 1;
      } else {
        const down = dp[(i + 1) * w + j];
        const right = dp[i * w + j + 1];
        dp[i * w + j] = down >= right ? down : right;
      }
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let oldNum = 1;
  let newNum = 1;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ op: "ctx", text: a[i], oldNum: oldNum++, newNum: newNum++ });
      i++;
      j++;
    } else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) {
      out.push({ op: "del", text: a[i], oldNum: oldNum++ });
      i++;
    } else {
      out.push({ op: "add", text: b[j], newNum: newNum++ });
      j++;
    }
  }
  while (i < m) out.push({ op: "del", text: a[i++], oldNum: oldNum++ });
  while (j < n) out.push({ op: "add", text: b[j++], newNum: newNum++ });
  return out;
}

export function diffSummary(lines: DiffLine[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const l of lines) {
    if (l.op === "add") added++;
    else if (l.op === "del") removed++;
  }
  return { added, removed };
}
