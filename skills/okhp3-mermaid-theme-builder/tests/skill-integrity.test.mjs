/**
 * skill-integrity.test.mjs
 * Validates the SKILL.md file: frontmatter parseable, required fields present,
 * referenced files exist, no stale version references remain.
 * Run with: node --test tests/skill-integrity.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillRoot = join(__dirname, "..");
const skillMdPath = join(skillRoot, "SKILL.md");

function parseSkillFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  return match[1];
}

function extractYamlField(frontmatter, key) {
  const patterns = [
    new RegExp(`^${key}:\\s*"([^"]+)"`, "m"),
    new RegExp(`^${key}:\\s*'([^']+)'`, "m"),
    new RegExp(`^${key}:\\s*(.+)$`, "m"),
  ];
  for (const re of patterns) {
    const m = frontmatter.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

const skillContent = readFileSync(skillMdPath, "utf8");
const frontmatter = parseSkillFrontmatter(skillContent);

// ── Frontmatter structure ──────────────────────────────────────────────────

test("SKILL.md contains a frontmatter block", () => {
  assert.ok(frontmatter !== null, "Expected --- frontmatter --- block at top of SKILL.md");
});

test("frontmatter contains name field", () => {
  const name = extractYamlField(frontmatter, "name");
  assert.ok(name && name.length > 0, "Missing 'name' in frontmatter");
});

test("frontmatter name is correct", () => {
  const name = extractYamlField(frontmatter, "name");
  assert.equal(name, "okhp3-mermaid-theme-builder");
});

test("frontmatter contains license field", () => {
  assert.ok(frontmatter.includes("license:"), "Missing 'license' in frontmatter");
});

test("frontmatter contains metadata block", () => {
  assert.ok(frontmatter.includes("metadata:"), "Missing 'metadata:' block in frontmatter");
});

test("frontmatter metadata contains version", () => {
  assert.ok(frontmatter.includes("version:"), "Missing 'version' under metadata");
});

test("frontmatter metadata contains author", () => {
  assert.ok(frontmatter.includes("author:"), "Missing 'author' under metadata");
});

test("frontmatter metadata contains homepage", () => {
  assert.ok(frontmatter.includes("homepage:"), "Missing 'homepage' under metadata");
});

test("frontmatter metadata contains repository", () => {
  assert.ok(frontmatter.includes("repository:"), "Missing 'repository' under metadata");
});

test("frontmatter metadata contains category", () => {
  assert.ok(frontmatter.includes("category:"), "Missing 'category' under metadata");
});

test("frontmatter metadata contains tags", () => {
  assert.ok(frontmatter.includes("tags:"), "Missing 'tags' under metadata");
});

// ── Version alignment ──────────────────────────────────────────────────────

test("skill version is not stale 0.3.0", () => {
  assert.ok(
    !skillContent.includes('"0.3.0"') && !skillContent.includes("'0.3.0'"),
    "Stale version '0.3.0' found in SKILL.md — update to current version"
  );
});

test("skill version is 0.5.0", () => {
  assert.ok(
    skillContent.includes('"0.5.0"') || skillContent.includes("version: 0.5.0"),
    "Expected version '0.5.0' in SKILL.md metadata"
  );
});

// ── Required content sections ─────────────────────────────────────────────

test("SKILL.md contains 'When to use' section", () => {
  assert.ok(skillContent.includes("## When to use"), "Missing '## When to use' section");
});

test("SKILL.md contains 'When NOT to use' section", () => {
  assert.ok(skillContent.includes("## When NOT to use"), "Missing '## When NOT to use' section");
});

test("SKILL.md contains workflow section", () => {
  assert.ok(
    skillContent.includes("## 7-Step Workflow") || skillContent.includes("## 6-Step Workflow"),
    "Missing workflow section"
  );
});

test("SKILL.md contains Output Modes section", () => {
  assert.ok(skillContent.includes("## Output Modes"), "Missing '## Output Modes' section");
});

test("SKILL.md contains Support Taxonomy section", () => {
  assert.ok(skillContent.includes("## Support Taxonomy"), "Missing '## Support Taxonomy' section");
});

test("SKILL.md contains Security and Privacy section", () => {
  assert.ok(
    skillContent.includes("## Security and Privacy"),
    "Missing '## Security and Privacy' section"
  );
});

test("SKILL.md contains Worked Examples section", () => {
  assert.ok(skillContent.includes("## Worked Examples"), "Missing '## Worked Examples' section");
});

test("SKILL.md documents Format A output mode", () => {
  assert.ok(skillContent.includes("Format A"), "Missing Format A in Output Modes");
});

test("SKILL.md documents Format B output mode", () => {
  assert.ok(skillContent.includes("Format B"), "Missing Format B in Output Modes");
});

test("SKILL.md documents Format C output mode", () => {
  assert.ok(skillContent.includes("Format C"), "Missing Format C in Output Modes");
});

test("SKILL.md documents Format F (renderer compatibility notes)", () => {
  assert.ok(skillContent.includes("Format F"), "Missing Format F (Renderer Compatibility Notes) in Output Modes");
});

// ── References ─────────────────────────────────────────────────────────────

test("references/palette-registry.md exists", () => {
  assert.ok(
    existsSync(join(skillRoot, "references/palette-registry.md")),
    "references/palette-registry.md not found"
  );
});

test("references/mermaid-theme-variables.md exists", () => {
  assert.ok(
    existsSync(join(skillRoot, "references/mermaid-theme-variables.md")),
    "references/mermaid-theme-variables.md not found"
  );
});

test("references/renderer-profiles.md exists", () => {
  assert.ok(
    existsSync(join(skillRoot, "references/renderer-profiles.md")),
    "references/renderer-profiles.md not found"
  );
});

test("references/output-format-contract.md exists", () => {
  assert.ok(
    existsSync(join(skillRoot, "references/output-format-contract.md")),
    "references/output-format-contract.md not found"
  );
});

test("references/prompt-scaffold-patterns.md exists", () => {
  assert.ok(
    existsSync(join(skillRoot, "references/prompt-scaffold-patterns.md")),
    "references/prompt-scaffold-patterns.md not found"
  );
});

test("references/scope-firewall.md exists", () => {
  assert.ok(
    existsSync(join(skillRoot, "references/scope-firewall.md")),
    "references/scope-firewall.md not found"
  );
});

test("assets/palettes.json exists", () => {
  assert.ok(
    existsSync(join(skillRoot, "assets/palettes.json")),
    "assets/palettes.json not found"
  );
});

test("assets/renderer-profiles.json exists", () => {
  assert.ok(
    existsSync(join(skillRoot, "assets/renderer-profiles.json")),
    "assets/renderer-profiles.json not found"
  );
});

test("assets/theme-variable-map.json exists", () => {
  assert.ok(
    existsSync(join(skillRoot, "assets/theme-variable-map.json")),
    "assets/theme-variable-map.json not found"
  );
});

// ── Asset validity ─────────────────────────────────────────────────────────

test("assets/palettes.json is valid JSON", () => {
  const raw = readFileSync(join(skillRoot, "assets/palettes.json"), "utf8");
  assert.doesNotThrow(() => JSON.parse(raw), "assets/palettes.json is not valid JSON");
});

test("assets/palettes.json contains all 7 canonical palette IDs", () => {
  const palettes = JSON.parse(readFileSync(join(skillRoot, "assets/palettes.json"), "utf8"));
  const paletteIds = Array.isArray(palettes)
    ? palettes.map((p) => p.id)
    : Object.keys(palettes);
  const expected = ["overkill-hill", "askjamie", "glee-fully", "ocean-depth", "forest-sage", "slate-ember", "violet-mist"];
  for (const id of expected) {
    assert.ok(
      paletteIds.includes(id),
      `Palette '${id}' missing from assets/palettes.json`
    );
  }
});

test("assets/renderer-profiles.json is valid JSON", () => {
  const raw = readFileSync(join(skillRoot, "assets/renderer-profiles.json"), "utf8");
  assert.doesNotThrow(() => JSON.parse(raw), "assets/renderer-profiles.json is not valid JSON");
});

// ── Output rules completeness ─────────────────────────────────────────────

test("SKILL.md Output Rules includes theme:base rule", () => {
  assert.ok(
    skillContent.includes('"theme": "base"') || skillContent.includes("theme.*base.*required"),
    "Output Rules must enforce theme:base"
  );
});

test("SKILL.md Output Rules forbids hallucinated themeVariable names", () => {
  assert.ok(
    skillContent.includes("Never invent themeVariable") ||
      skillContent.includes("hallucinated"),
    "Output Rules must forbid hallucinated themeVariable names"
  );
});

// ── Scope firewall ─────────────────────────────────────────────────────────

test("SKILL.md references scope-firewall.md", () => {
  assert.ok(
    skillContent.includes("scope-firewall.md"),
    "SKILL.md must reference references/scope-firewall.md"
  );
});

// ── Renderer caveat language ───────────────────────────────────────────────

test("SKILL.md mentions GitHub renderer by name", () => {
  assert.ok(skillContent.includes("GitHub"), "Missing GitHub renderer reference");
});

test("SKILL.md mentions Notion renderer by name", () => {
  assert.ok(skillContent.includes("Notion"), "Missing Notion renderer reference");
});

test("SKILL.md mentions Confluence renderer by name", () => {
  assert.ok(skillContent.includes("Confluence"), "Missing Confluence renderer reference");
});

test("SKILL.md includes privacy/local-only statement", () => {
  assert.ok(
    skillContent.includes("no external network") ||
      skillContent.includes("No external network") ||
      skillContent.includes("local"),
    "Missing local/no-external-network privacy statement"
  );
});
