import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT = resolve("scripts/sync-skills-catalog.mjs");
const CATALOG_TEMPLATE = `const SKILLS_BASE_URL = "https://example.test/skills";

export const PUBLIC_MERMAID_SKILLS = [
  // SKILLS_CATALOG_GENERATED_START
  // SKILLS_CATALOG_GENERATED_END
];
`;

function createFixture(frontmatter) {
  const root = mkdtempSync(join(tmpdir(), "skills-catalog-"));
  const skillsDir = join(root, "skills");
  const skillDir = join(skillsDir, "okhp3-mermaid-fixture");
  const output = join(root, "skills-catalog.ts");
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, "SKILL.md"), frontmatter);
  writeFileSync(output, CATALOG_TEMPLATE);
  return { root, skillsDir, skillDir, output };
}

function run(fixture, ...args) {
  return spawnSync(
    process.execPath,
    [SCRIPT, "--skills-dir", fixture.skillsDir, "--output", fixture.output, ...args],
    { encoding: "utf8" }
  );
}

function skillFile({ category = "diagramming", catalogDescription, catalogRole } = {}) {
  const catalogFields = [
    catalogDescription ? `  catalog_description: "${catalogDescription}"` : "",
    catalogRole ? `  catalog_role: "${catalogRole}"` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return `---
name: okhp3-mermaid-fixture
description: >-
  Canonical package description.
metadata:
  version: "1.2.3"
  category: ${category}
${catalogFields}
---
`;
}

test("catalog metadata changes fail --check until the array is regenerated", () => {
  const fixture = createFixture(
    skillFile({
      catalogDescription: "Initial Reference-tab summary.",
      catalogRole: "domain",
    })
  );
  try {
    assert.equal(run(fixture).status, 0);
    assert.equal(run(fixture, "--check").status, 0);

    writeFileSync(
      join(fixture.skillDir, "SKILL.md"),
      skillFile({
        catalogDescription: "Updated Reference-tab summary.",
        catalogRole: "workflow",
      })
    );
    const stale = run(fixture, "--check");
    assert.equal(stale.status, 1);
    assert.match(stale.stderr, /Skill catalog drift detected/);

    assert.equal(run(fixture).status, 0);
    const generated = readFileSync(fixture.output, "utf8");
    assert.match(generated, /Updated Reference-tab summary/);
    assert.match(generated, /role: "workflow"/);
    assert.equal(run(fixture, "--check").status, 0);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("canonical description and category remain authoritative without UI metadata", () => {
  const fixture = createFixture(skillFile());
  try {
    assert.equal(run(fixture).status, 0);
    assert.match(readFileSync(fixture.output, "utf8"), /Canonical package description/);
    assert.match(readFileSync(fixture.output, "utf8"), /role: "domain"/);

    writeFileSync(
      join(fixture.skillDir, "SKILL.md"),
      skillFile({ category: "workflow" }).replace(
        "Canonical package description.",
        "Changed canonical package description."
      )
    );
    assert.equal(run(fixture, "--check").status, 1);
    assert.equal(run(fixture).status, 0);

    const generated = readFileSync(fixture.output, "utf8");
    assert.match(generated, /Changed canonical package description/);
    assert.match(generated, /role: "workflow"/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});
