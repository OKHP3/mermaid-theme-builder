import { describe, it, expect } from "vitest";
import { diffLines, diffSummary } from "@/lib/diff";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SIMPLE_DIAGRAM = "flowchart TD\n  A --> B\n  B --> C";

const INIT_DIRECTIVE =
  '%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#ff0000"}}}%%';

/** Themed version: init directive prepended to original diagram. */
const THEMED_DIAGRAM = `${INIT_DIRECTIVE}\n${SIMPLE_DIAGRAM}`;

// ---------------------------------------------------------------------------
// diffLines
// ---------------------------------------------------------------------------

describe("diffLines — identical inputs (empty diff)", () => {
  it("produces no add or del lines — the diff is empty of changes", () => {
    const result = diffLines(SIMPLE_DIAGRAM, SIMPLE_DIAGRAM);
    const changes = result.filter((l) => l.op === "add" || l.op === "del");
    expect(changes).toHaveLength(0);
  });

  it("all lines are context when inputs are identical", () => {
    const result = diffLines(SIMPLE_DIAGRAM, SIMPLE_DIAGRAM);
    expect(result.every((l) => l.op === "ctx")).toBe(true);
  });

  it("diffSummary reports zero added and zero removed for identical inputs", () => {
    const result = diffLines(SIMPLE_DIAGRAM, SIMPLE_DIAGRAM);
    const { added, removed } = diffSummary(result);
    expect(added).toBe(0);
    expect(removed).toBe(0);
  });

  it("empty-string inputs produce exactly one context line with empty text", () => {
    // "".split("\n") yields [""], so diffLines("", "") returns a single ctx line
    const result = diffLines("", "");
    expect(result).toHaveLength(1);
    expect(result[0].op).toBe("ctx");
    expect(result[0].text).toBe("");
  });
});

describe("diffLines — init directive insertion", () => {
  it("returns a non-empty array when inputs differ", () => {
    const result = diffLines(SIMPLE_DIAGRAM, THEMED_DIAGRAM);
    expect(result.length).toBeGreaterThan(0);
  });

  it("contains at least one 'add' line when new text has extra lines", () => {
    const result = diffLines(SIMPLE_DIAGRAM, THEMED_DIAGRAM);
    const adds = result.filter((l) => l.op === "add");
    expect(adds.length).toBeGreaterThan(0);
  });

  it("includes the init directive text as an addition", () => {
    const result = diffLines(SIMPLE_DIAGRAM, THEMED_DIAGRAM);
    const addedTexts = result
      .filter((l) => l.op === "add")
      .map((l) => l.text);
    expect(addedTexts).toContain(INIT_DIRECTIVE);
  });

  it("contains no deletions when only the directive is prepended", () => {
    const result = diffLines(SIMPLE_DIAGRAM, THEMED_DIAGRAM);
    const dels = result.filter((l) => l.op === "del");
    expect(dels.length).toBe(0);
  });

  it("preserves the original diagram lines as context", () => {
    const result = diffLines(SIMPLE_DIAGRAM, THEMED_DIAGRAM);
    const ctxTexts = result
      .filter((l) => l.op === "ctx")
      .map((l) => l.text);
    for (const line of SIMPLE_DIAGRAM.split("\n")) {
      expect(ctxTexts).toContain(line);
    }
  });
});

describe("diffLines — completely replaced input (all lines changed)", () => {
  // These two strings share no common lines, so every line must be add or del.
  const oldText = "flowchart LR\n  X --> Y";
  const newText = "sequenceDiagram\n  Alice->>Bob: hello\n  Bob-->>Alice: hi";

  it("returns a non-empty array", () => {
    const result = diffLines(oldText, newText);
    expect(result.length).toBeGreaterThan(0);
  });

  it("contains no context lines — all lines are changed", () => {
    const result = diffLines(oldText, newText);
    const ctxLines = result.filter((l) => l.op === "ctx");
    expect(ctxLines).toHaveLength(0);
  });

  it("all old lines appear as deletions", () => {
    const result = diffLines(oldText, newText);
    const dels = result.filter((l) => l.op === "del");
    expect(dels.length).toBe(oldText.split("\n").length);
  });

  it("all new lines appear as additions", () => {
    const result = diffLines(oldText, newText);
    const adds = result.filter((l) => l.op === "add");
    expect(adds.length).toBe(newText.split("\n").length);
  });
});

describe("diffLines — line numbers", () => {
  it("assigns oldNum to del and ctx lines", () => {
    const result = diffLines(SIMPLE_DIAGRAM, THEMED_DIAGRAM);
    for (const l of result) {
      if (l.op === "del" || l.op === "ctx") {
        expect(typeof l.oldNum).toBe("number");
      }
    }
  });

  it("assigns newNum to add and ctx lines", () => {
    const result = diffLines(SIMPLE_DIAGRAM, THEMED_DIAGRAM);
    for (const l of result) {
      if (l.op === "add" || l.op === "ctx") {
        expect(typeof l.newNum).toBe("number");
      }
    }
  });

  it("old line numbers start at 1 and are strictly increasing", () => {
    const result = diffLines(SIMPLE_DIAGRAM, THEMED_DIAGRAM);
    const oldNums = result
      .filter((l) => l.op === "del" || l.op === "ctx")
      .map((l) => l.oldNum as number);
    expect(oldNums[0]).toBe(1);
    for (let i = 1; i < oldNums.length; i++) {
      expect(oldNums[i]).toBeGreaterThan(oldNums[i - 1]);
    }
  });

  it("new line numbers start at 1 and are strictly increasing", () => {
    const result = diffLines(SIMPLE_DIAGRAM, THEMED_DIAGRAM);
    const newNums = result
      .filter((l) => l.op === "add" || l.op === "ctx")
      .map((l) => l.newNum as number);
    expect(newNums[0]).toBe(1);
    for (let i = 1; i < newNums.length; i++) {
      expect(newNums[i]).toBeGreaterThan(newNums[i - 1]);
    }
  });
});

describe("diffLines — single-line inputs", () => {
  it("marks single changed line as del+add", () => {
    const result = diffLines("line one", "line two");
    const ops = result.map((l) => l.op);
    expect(ops).toContain("del");
    expect(ops).toContain("add");
    expect(ops).not.toContain("ctx");
  });

  it("marks single identical line as ctx", () => {
    const result = diffLines("same line", "same line");
    expect(result).toHaveLength(1);
    expect(result[0].op).toBe("ctx");
  });
});

// ---------------------------------------------------------------------------
// diffSummary
// ---------------------------------------------------------------------------

describe("diffSummary", () => {
  it("returns zero counts for identical inputs", () => {
    const lines = diffLines(SIMPLE_DIAGRAM, SIMPLE_DIAGRAM);
    const { added, removed } = diffSummary(lines);
    expect(added).toBe(0);
    expect(removed).toBe(0);
  });

  it("returns correct added count when directive is prepended", () => {
    const lines = diffLines(SIMPLE_DIAGRAM, THEMED_DIAGRAM);
    const { added, removed } = diffSummary(lines);
    // One init directive line added
    expect(added).toBe(1);
    expect(removed).toBe(0);
  });

  it("counts both additions and removals for fully replaced content", () => {
    const oldText = "flowchart LR\n  X --> Y";
    const newText = "sequenceDiagram\n  Alice->>Bob: hello\n  Bob-->>Alice: hi";
    const lines = diffLines(oldText, newText);
    const { added, removed } = diffSummary(lines);
    expect(added).toBeGreaterThan(0);
    expect(removed).toBeGreaterThan(0);
  });

  it("summary added + ctx equals total new lines", () => {
    const oldText = "flowchart TD\n  A-->B";
    const newText = "flowchart TD\n  A-->B\n  B-->C\n  C-->D";
    const lines = diffLines(oldText, newText);
    const { added } = diffSummary(lines);
    const ctxCount = lines.filter((l) => l.op === "ctx").length;
    const newLineCount = newText.split("\n").length;
    expect(added + ctxCount).toBe(newLineCount);
  });

  it("summary removed + ctx equals total old lines", () => {
    const oldText = "flowchart TD\n  A-->B\n  B-->C\n  C-->D";
    const newText = "flowchart TD\n  A-->B";
    const lines = diffLines(oldText, newText);
    const { removed } = diffSummary(lines);
    const ctxCount = lines.filter((l) => l.op === "ctx").length;
    const oldLineCount = oldText.split("\n").length;
    expect(removed + ctxCount).toBe(oldLineCount);
  });
});
