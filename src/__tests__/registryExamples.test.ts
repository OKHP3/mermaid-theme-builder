import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { DIAGRAM_CAPABILITIES, type DiagramFamily } from "@/data/mermaid-capabilities";
import { EXAMPLE_CATALOG } from "@/data/example-library";

const EXAMPLES_DIR = path.resolve(import.meta.dirname, "../../examples");

// ── .mmd authoring files ─────────────────────────────────────────────────────

describe("Registry-example consistency guard", () => {
  it("examples directory exists", () => {
    expect(fs.existsSync(EXAMPLES_DIR), `examples/ directory must exist at ${EXAMPLES_DIR}`).toBe(
      true
    );
  });

  it("every registry entry with examplePending:false has an existing example file", () => {
    const missing: string[] = [];
    for (const cap of DIAGRAM_CAPABILITIES) {
      if (!cap.examplePending && cap.exampleFile) {
        const filePath = path.join(EXAMPLES_DIR, cap.exampleFile);
        if (!fs.existsSync(filePath)) {
          missing.push(`${cap.id}: ${cap.exampleFile}`);
        }
      }
    }
    expect(
      missing,
      `Registry entries marked examplePending:false but missing .mmd file:\n${missing.join("\n")}`
    ).toHaveLength(0);
  });

  it("every registry entry with examplePending:false has a non-null exampleFile", () => {
    const nullFiles: string[] = [];
    for (const cap of DIAGRAM_CAPABILITIES) {
      if (!cap.examplePending && cap.exampleFile === null) {
        nullFiles.push(cap.id);
      }
    }
    expect(
      nullFiles,
      `Registry entries have examplePending:false but exampleFile:null:\n${nullFiles.join("\n")}`
    ).toHaveLength(0);
  });

  it("every .mmd file in examples/ is non-empty", () => {
    if (!fs.existsSync(EXAMPLES_DIR)) return;
    const files = fs.readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith(".mmd"));
    const empty: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(EXAMPLES_DIR, file), "utf-8").trim();
      if (content.length === 0) empty.push(file);
    }
    expect(empty, `Empty .mmd example files:\n${empty.join("\n")}`).toHaveLength(0);
  });

  it("wardley entry has examplePending:false (Wardley shipped in 11.14)", () => {
    const wardley = DIAGRAM_CAPABILITIES.find((c) => c.id === "wardley");
    expect(wardley).toBeDefined();
    expect(wardley?.examplePending).toBe(false);
    expect(wardley?.exampleFile).toBeTruthy();
  });

  it("eventModeling entry has an exampleFile set", () => {
    const em = DIAGRAM_CAPABILITIES.find((c) => c.id === "eventModeling");
    expect(em).toBeDefined();
    expect(em?.exampleFile).toBeTruthy();
  });
});

// ── EXAMPLE_CATALOG vs capability registry ───────────────────────────────────
//
// The `family` field on ExampleEntry uses stable shorthand aliases (e.g.
// "sequence", "class", "er") that are shorter than the canonical registry IDs
// (e.g. "sequenceDiagram", "classDiagram", "erDiagram"). This mapping is the
// authoritative source of truth for that alias → registry-id relationship.
//
// ADD a new entry here whenever a new diagram family is added to example-library.ts.
// If an entry's alias is absent from this map the test fails loudly — that is
// the build-breaking consistency guard the task requires.
//
const FAMILY_ALIAS_TO_REGISTRY_ID: Record<string, DiagramFamily> = {
  // aliases that differ from the canonical registry id
  sequence: "sequenceDiagram",
  class: "classDiagram",
  er: "erDiagram",
  state: "stateDiagram",
  requirement: "requirementDiagram",
  quadrant: "quadrantChart",
  gitgraph: "gitGraph",

  // aliases that ARE the canonical registry id (still listed for completeness)
  flowchart: "flowchart",
  pie: "pie",
  sankey: "sankey",
  gantt: "gantt",
  timeline: "timeline",
  journey: "journey",
  mindmap: "mindmap",
  eventModeling: "eventModeling",
  wardley: "wardley",

  // new families added in Batch #1
  architectureBeta: "architectureBeta",
  block: "block",
  c4: "c4Diagram",
  kanban: "kanban",
  packet: "packet",
  radar: "radar",
  xychart: "xychart",

  // new families added in Batch #2
  treemap: "treemap",

  // new families added in Batch #3
  zenuml: "zenuml",
  venn: "venn",
  ishikawa: "ishikawa",
};

describe("EXAMPLE_CATALOG — registry consistency guard", () => {
  it("EXAMPLE_CATALOG is non-empty", () => {
    expect(EXAMPLE_CATALOG.length).toBeGreaterThan(0);
  });

  it("every example entry has a non-empty id", () => {
    for (const entry of EXAMPLE_CATALOG) {
      expect(entry.id, "id must be non-empty").toBeTruthy();
    }
  });

  it("every example entry has a non-empty label", () => {
    for (const entry of EXAMPLE_CATALOG) {
      expect(entry.label, `${entry.id} must have a non-empty label`).toBeTruthy();
    }
  });

  it("every example entry has a non-empty content string", () => {
    for (const entry of EXAMPLE_CATALOG) {
      expect(
        entry.content.trim().length,
        `${entry.id} must have non-empty content`
      ).toBeGreaterThan(0);
    }
  });

  it("every example entry has a known family alias", () => {
    const unknownAliases: string[] = [];
    for (const entry of EXAMPLE_CATALOG) {
      if (!(entry.family in FAMILY_ALIAS_TO_REGISTRY_ID)) {
        unknownAliases.push(`${entry.id}: family="${entry.family}"`);
      }
    }
    expect(
      unknownAliases,
      `EXAMPLE_CATALOG entries use unknown family aliases not in FAMILY_ALIAS_TO_REGISTRY_ID.\n` +
        `Add the missing alias to the mapping in registryExamples.test.ts:\n${unknownAliases.join("\n")}`
    ).toHaveLength(0);
  });

  it("every example family alias resolves to an existing capability registry entry", () => {
    const registryIds = new Set(DIAGRAM_CAPABILITIES.map((c) => c.id));
    const broken: string[] = [];
    for (const entry of EXAMPLE_CATALOG) {
      const registryId = FAMILY_ALIAS_TO_REGISTRY_ID[entry.family];
      if (!registryId || !registryIds.has(registryId)) {
        broken.push(
          `${entry.id}: family="${entry.family}" → registryId="${registryId ?? "(no mapping)"}" not found in DIAGRAM_CAPABILITIES`
        );
      }
    }
    expect(
      broken,
      `EXAMPLE_CATALOG entries whose family does not resolve to a registry entry:\n${broken.join("\n")}`
    ).toHaveLength(0);
  });

  it("family alias map covers all aliases actually used in EXAMPLE_CATALOG", () => {
    const usedAliases = new Set(EXAMPLE_CATALOG.map((e) => e.family));
    const mappedAliases = new Set(Object.keys(FAMILY_ALIAS_TO_REGISTRY_ID));
    const unmapped: string[] = [];
    for (const alias of usedAliases) {
      if (!mappedAliases.has(alias)) {
        unmapped.push(alias);
      }
    }
    expect(
      unmapped,
      `These family aliases appear in EXAMPLE_CATALOG but are absent from FAMILY_ALIAS_TO_REGISTRY_ID:\n${unmapped.join("\n")}`
    ).toHaveLength(0);
  });

  it("no example entry has duplicate ids", () => {
    const ids = EXAMPLE_CATALOG.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all example ids are unique across the EXAMPLE_CATALOG", () => {
    const seen = new Map<string, number>();
    const dupes: string[] = [];
    for (const entry of EXAMPLE_CATALOG) {
      seen.set(entry.id, (seen.get(entry.id) ?? 0) + 1);
    }
    for (const [id, count] of seen) {
      if (count > 1) dupes.push(`${id} (appears ${count} times)`);
    }
    expect(dupes, `Duplicate example ids:\n${dupes.join("\n")}`).toHaveLength(0);
  });
});
