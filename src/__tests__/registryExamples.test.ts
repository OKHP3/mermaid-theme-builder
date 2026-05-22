import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { DIAGRAM_CAPABILITIES } from "@/data/mermaid-capabilities";

const EXAMPLES_DIR = path.resolve(import.meta.dirname, "../../examples");

describe("Registry-example consistency guard", () => {
  it("examples directory exists", () => {
    expect(fs.existsSync(EXAMPLES_DIR), `examples/ directory must exist at ${EXAMPLES_DIR}`).toBe(true);
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
      `Registry entries marked examplePending:false but missing .mmd file:\n${missing.join("\n")}`,
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
      `Registry entries have examplePending:false but exampleFile:null:\n${nullFiles.join("\n")}`,
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
