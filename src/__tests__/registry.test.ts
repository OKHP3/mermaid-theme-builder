import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { MERMAID_VERSION_VERIFIED, DIAGRAM_CAPABILITIES } from "@/data/mermaid-capabilities";
import { detectDiagram } from "@/lib/detector";

// ── Version sync guard ───────────────────────────────────────────────────────

describe("MERMAID_VERSION_VERIFIED", () => {
  it("matches the mermaid version pinned in package.json", () => {
    const pkgPath = resolve(import.meta.dirname, "../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
      dependencies?: Record<string, string>;
    };
    const installedVersion = pkg.dependencies?.["mermaid"];
    expect(installedVersion).toBeDefined();
    expect(MERMAID_VERSION_VERIFIED).toBe(installedVersion);
  });
});

// ── Diagram breaker warning checks ──────────────────────────────────────────

describe("detectDiagram — Diagram Breaker #1: bare 'end' node ID", () => {
  it("does NOT warn for valid subgraph-closing 'end' in flowchart", () => {
    const code = `flowchart TD
  subgraph Cluster
    A --> B
  end
  B --> C`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find((w) => w.includes("Diagram Breaker") && w.includes("end"));
    expect(breaker).toBeUndefined();
  });

  it("warns when 'end' is used as an edge source in flowchart", () => {
    const code = `flowchart TD
  end --> B`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find((w) => w.includes("Diagram Breaker") && w.includes("end"));
    expect(breaker).toBeDefined();
  });

  it("warns when 'end' is used as an edge target in flowchart", () => {
    const code = `flowchart TD
  A --> end`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find((w) => w.includes("Diagram Breaker") && w.includes("end"));
    expect(breaker).toBeDefined();
  });

  it("warns when 'end' is used as a node definition in flowchart", () => {
    const code = `flowchart TD
  end[My Node] --> B`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find((w) => w.includes("Diagram Breaker") && w.includes("end"));
    expect(breaker).toBeDefined();
  });

  it("does NOT warn for valid loop-closing 'end' in sequenceDiagram", () => {
    const code = `sequenceDiagram
  loop Every minute
    A->>B: Ping
  end`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find((w) => w.includes("Diagram Breaker") && w.includes("end"));
    expect(breaker).toBeUndefined();
  });

  it("warns when 'end' is declared as a participant in sequenceDiagram", () => {
    const code = `sequenceDiagram
  participant end
  A->>end: hello`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find((w) => w.includes("Diagram Breaker") && w.includes("end"));
    expect(breaker).toBeDefined();
  });

  it("warns when 'end' is used as a message source in sequenceDiagram", () => {
    const code = `sequenceDiagram
  end->>A: message`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find((w) => w.includes("Diagram Breaker") && w.includes("end"));
    expect(breaker).toBeDefined();
  });
});

describe("detectDiagram — Diagram Breaker #2: curly braces in %% comments", () => {
  it("warns when a %% comment contains {", () => {
    const code = `flowchart TD
  %% This is a {bad} comment
  A --> B`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find(
      (w) => w.includes("Diagram Breaker") && w.includes("curly")
    );
    expect(breaker).toBeDefined();
  });

  it("does NOT warn for a legitimate %%{init}%% directive", () => {
    const code = `%%{init: {"theme": "base"}}%%
flowchart TD
  A --> B`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find(
      (w) => w.includes("Diagram Breaker") && w.includes("curly")
    );
    expect(breaker).toBeUndefined();
  });

  it("does NOT warn for %% comments without curly braces", () => {
    const code = `flowchart TD
  %% This is a safe comment
  A --> B`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find(
      (w) => w.includes("Diagram Breaker") && w.includes("curly")
    );
    expect(breaker).toBeUndefined();
  });
});

describe("detectDiagram — Diagram Breaker #3: nested node definitions without quotes", () => {
  it("warns when a node label contains an unquoted [", () => {
    const code = `flowchart TD
  A[outer [inner]] --> B`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find(
      (w) => w.includes("Diagram Breaker") && w.includes("nested")
    );
    expect(breaker).toBeDefined();
  });

  it("does NOT warn for properly quoted labels", () => {
    const code = `flowchart TD
  A["label with [brackets]"] --> B`;
    const result = detectDiagram(code);
    const breaker = result.warnings.find(
      (w) => w.includes("Diagram Breaker") && w.includes("nested")
    );
    expect(breaker).toBeUndefined();
  });
});

// ── Registry completeness guard ──────────────────────────────────────────────

describe("DIAGRAM_CAPABILITIES registry", () => {
  it("every entry has minMermaidVersion set", () => {
    for (const cap of DIAGRAM_CAPABILITIES) {
      expect(cap.minMermaidVersion, `${cap.id} missing minMermaidVersion`).toBeDefined();
    }
  });

  it("every entry has supportedLooks set", () => {
    for (const cap of DIAGRAM_CAPABILITIES) {
      expect(cap.supportedLooks, `${cap.id} missing supportedLooks`).toBeDefined();
    }
  });

  it("every entry has unsupportedLooks set", () => {
    for (const cap of DIAGRAM_CAPABILITIES) {
      expect(cap.unsupportedLooks, `${cap.id} missing unsupportedLooks`).toBeDefined();
    }
  });

  it("includes an eventModeling entry", () => {
    const em = DIAGRAM_CAPABILITIES.find((c) => c.id === "eventModeling");
    expect(em).toBeDefined();
    expect(em?.minMermaidVersion).toBe("11.15.0");
  });

  it("wardley entry has a resolved example (not pending)", () => {
    const w = DIAGRAM_CAPABILITIES.find((c) => c.id === "wardley");
    expect(w).toBeDefined();
    expect(w?.examplePending).toBe(false);
    expect(w?.exampleFile).toBeTruthy();
  });
});
