import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLIC_MERMAID_SKILLS } from "@/data/skills-catalog";

const skillsDirectory = resolve(import.meta.dirname, "../../skills");
const skillFolderNames = readdirSync(skillsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
  .map((entry) => entry.name)
  .sort();
const registeredSkillNames = PUBLIC_MERMAID_SKILLS.map((skill) => skill.name).sort();

describe("Reference-tab skills catalog matches skills/", () => {
  it("registers every skill folder", () => {
    const missingFromCatalog = skillFolderNames.filter(
      (folderName) => !registeredSkillNames.includes(folderName)
    );

    expect(
      missingFromCatalog,
      `Add these skills/ folders to PUBLIC_MERMAID_SKILLS: ${missingFromCatalog.join(", ")}`
    ).toEqual([]);
  });

  it("keeps every registered skill backed by a folder", () => {
    const missingFromDisk = registeredSkillNames.filter(
      (skillName) => !skillFolderNames.includes(skillName)
    );

    expect(
      missingFromDisk,
      `Remove these stale PUBLIC_MERMAID_SKILLS entries or restore their skills/ folders: ${missingFromDisk.join(", ")}`
    ).toEqual([]);
  });
});
