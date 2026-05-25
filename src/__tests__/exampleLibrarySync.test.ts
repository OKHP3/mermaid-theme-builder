import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { EXAMPLE_CATALOG } from "@/data/example-library";

const EXAMPLES_DIR = path.resolve(import.meta.dirname, "../../examples");

const SYNC_CASES: Array<{ catalogId: string; mmdFile: string }> = [
  { catalogId: "block-mermaid-basic", mmdFile: "basic-block.mmd" },
  { catalogId: "c4-mermaid-basic", mmdFile: "basic-c4.mmd" },
  { catalogId: "radar-mermaid-basic", mmdFile: "basic-radar.mmd" },
  { catalogId: "xychart-mermaid-basic", mmdFile: "basic-xy.mmd" },
  { catalogId: "architecture-mermaid-basic", mmdFile: "basic-architecture.mmd" },
  { catalogId: "kanban-mermaid-basic", mmdFile: "basic-kanban.mmd" },
  { catalogId: "packet-mermaid-basic", mmdFile: "basic-packet.mmd" },
];

describe("example-library.ts ↔ examples/*.mmd sync guard", () => {
  for (const { catalogId, mmdFile } of SYNC_CASES) {
    it(`${catalogId} matches ${mmdFile}`, () => {
      const entry = EXAMPLE_CATALOG.find((e) => e.id === catalogId);
      expect(entry, `EXAMPLE_CATALOG entry "${catalogId}" not found`).toBeDefined();

      const filePath = path.join(EXAMPLES_DIR, mmdFile);
      expect(
        fs.existsSync(filePath),
        `Source file examples/${mmdFile} does not exist`,
      ).toBe(true);

      const fileContent = fs.readFileSync(filePath, "utf-8").trim();
      expect(entry!.content.trim()).toBe(fileContent);
    });
  }
});
