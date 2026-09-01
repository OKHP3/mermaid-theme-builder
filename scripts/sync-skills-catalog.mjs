#!/usr/bin/env node
/**
 * Rebuild the Reference-tab skill array from the publishable skills directory.
 *
 * The README catalog and the app catalog are separate generated surfaces.
 * Keep this script dependency-free so it can run locally and in CI whenever a
 * skill package is added or its metadata changes.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DEFAULT_SKILLS_DIR = "skills";
const DEFAULT_OUTPUT = "src/data/skills-catalog.ts";
const GENERATED_START = "  // SKILLS_CATALOG_GENERATED_START";
const GENERATED_END = "  // SKILLS_CATALOG_GENERATED_END";
const ROLE_ORDER = ["foundation", "domain", "tooling", "governance", "workflow"];

function compareCodePoints(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

const DISPLAY_NAME_OVERRIDES = {
  "okhp3-mermaid-architecture": "Architecture",
  "okhp3-mermaid-bpmn": "BPMN / Business Process",
  "okhp3-mermaid-core": "Mermaid Core",
  "okhp3-mermaid-data": "Data Models",
  "okhp3-mermaid-governance": "Governance",
  "okhp3-mermaid-publish": "Publish & Export",
  "okhp3-mermaid-repair": "Repair",
  "okhp3-mermaid-theme-builder": "Theme Builder",
  "okhp3-mermaid-update": "Update",
  "okhp3-skill-promotion": "Skill Promotion",
};

const ROLE_OVERRIDES = {
  "okhp3-mermaid-core": "foundation",
  "okhp3-mermaid-architecture": "domain",
  "okhp3-mermaid-bpmn": "domain",
  "okhp3-mermaid-data": "domain",
  "okhp3-mermaid-governance": "governance",
  "okhp3-mermaid-publish": "workflow",
  "okhp3-mermaid-repair": "workflow",
  "okhp3-mermaid-theme-builder": "tooling",
  "okhp3-mermaid-update": "workflow",
  "okhp3-skill-promotion": "tooling",
};

const DESCRIPTION_OVERRIDES = {
  "okhp3-mermaid-architecture":
    "System and solution architecture diagrams — C4 model (Context/Container/Component/Code), architecture-beta cloud diagrams, block diagrams, and integration flows.",
  "okhp3-mermaid-bpmn":
    "BPMN-informed business process modeling — workflows, approval chains, swim lanes, cross-department handoffs, and decision gateways in Mermaid syntax.",
  "okhp3-mermaid-core":
    "Foundation skill for all Mermaid diagram work — load this first. Handles diagram type selection, the OKHP3 design system, file naming, and the three-gate validation framework.",
  "okhp3-mermaid-data":
    "Entity-relationship diagrams, class diagrams, and schema documentation — data models and object structures with cardinality and relationship annotations.",
  "okhp3-mermaid-governance":
    "Establish visual and behavioral standards for a diagram family — conformance profiles, style rules, and governance checks for consistent team output.",
  "okhp3-mermaid-publish":
    "Render and publish finished diagrams — local PNG/SVG output, Markdown embedding, and Mermaid Chart MCP for shareable links. Use after passing all three validation gates.",
  "okhp3-mermaid-repair":
    "Syntax repair for broken Mermaid diagrams — diagnoses parse failures and applies the minimum fix without restructuring content, style, or labels.",
  "okhp3-mermaid-theme-builder":
    "Apply reusable color palettes and visual governance to Mermaid diagrams — themeVariables blocks, %%{init}%% configuration, and renderer-safe styled output.",
  "okhp3-mermaid-update":
    "Style-preserving update of an existing diagram — applies the minimum diff for new nodes, revised labels, or restructured flow without touching classDef or theme config.",
  "okhp3-skill-promotion":
    "Promote and synchronize a project-local Agent Skill into a portable, reviewable distribution package — provenance record, canonical family assignment, and safe handoff into OKHP3/skillz.",
};
function usage() {
  console.log(`Usage: node scripts/sync-skills-catalog.mjs [options]

Options:
  --skills-dir <path>  Skills directory to scan (default: skills)
  --output <path>      TypeScript catalog to update (default: src/data/skills-catalog.ts)
  --check              Validate and report drift without writing
`);
}

function parseArgs(argv) {
  const args = { skillsDir: DEFAULT_SKILLS_DIR, output: DEFAULT_OUTPUT, check: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--check") {
      args.check = true;
    } else if (arg === "--skills-dir" || arg === "--output") {
      const value = argv[i + 1];
      if (!value) throw new Error(`${arg} requires a path`);
      args[arg === "--skills-dir" ? "skillsDir" : "output"] = value;
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return args;
}

function unquote(value) {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(text, filePath) {
  const normalized = text.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error(`${filePath}: missing YAML frontmatter`);

  const lines = match[1].split("\n");
  const result = { metadata: {} };
  let activeBlock = null;
  let blockLines = [];
  let inMetadata = false;

  const flushBlock = () => {
    if (!activeBlock) return;
    result[activeBlock] = blockLines.join(" ").replace(/\s+/g, " ").trim();
    activeBlock = null;
    blockLines = [];
  };

  for (const line of lines) {
    if (activeBlock) {
      if (/^\s{2,}\S/.test(line) || line.trim() === "") {
        blockLines.push(line.trim());
        continue;
      }
      flushBlock();
    }

    const metadataMatch = line.match(/^metadata:\s*$/);
    if (metadataMatch) {
      inMetadata = true;
      continue;
    }

    if (inMetadata) {
      const nested = line.match(/^\s{2,}([A-Za-z0-9_-]+):\s*(.*)$/);
      if (nested) {
        result.metadata[nested[1]] = unquote(nested[2]);
        continue;
      }
      if (line.trim() !== "") inMetadata = false;
    }

    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;
    if (/^[>|][+-]?$/.test(field[2])) {
      activeBlock = field[1];
      blockLines = [];
    } else {
      result[field[1]] = unquote(field[2]);
    }
  }
  flushBlock();
  return result;
}

function displayNameFor(name, metadata = {}) {
  if (metadata.catalog_display_name) return metadata.catalog_display_name;
  if (DISPLAY_NAME_OVERRIDES[name]) return DISPLAY_NAME_OVERRIDES[name];
  const label = name
    .replace(/^okhp3-/, "")
    .replace(/^mermaid-/, "")
    .split("-")
    .map((word) => (word.toLowerCase() === "bpmn" ? "BPMN" : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
  return label || name;
}

function roleFor(name, category, metadata = {}) {
  if (metadata.catalog_role) return metadata.catalog_role;
  if (ROLE_OVERRIDES[name]) return ROLE_OVERRIDES[name];
  if (category === "diagramming") return "domain";
  if (category === "workflow") return "workflow";
  if (category === "governance") return "governance";
  return "tooling";
}

function descriptionFor(name, description, metadata = {}) {
  if (metadata.catalog_description) return metadata.catalog_description;
  if (DESCRIPTION_OVERRIDES[name]) return DESCRIPTION_OVERRIDES[name];
  return description.length <= 220 ? description : `${description.slice(0, 217).trimEnd()}...`;
}

async function discoverSkills(skillsDir) {
  let entries;
  try {
    entries = await readdir(skillsDir, { withFileTypes: true });
  } catch (error) {
    throw new Error(`Unable to read skills directory ${skillsDir}: ${error.message}`);
  }

  const skills = [];
  for (const entry of entries.sort((a, b) => compareCodePoints(a.name, b.name))) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const skillDir = join(skillsDir, entry.name);
    const skillPath = join(skillDir, "SKILL.md");
    let frontmatter;
    try {
      frontmatter = parseFrontmatter(await readFile(skillPath, "utf8"), skillPath);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw new Error(error.message);
    }

    const name = frontmatter.name;
    const version = frontmatter.metadata?.version;
    const category = frontmatter.metadata?.category;
    const description = frontmatter.description;
    if (!name || !version || !category || !description) {
      throw new Error(
        `${skillPath}: name, description, metadata.version, and metadata.category are required`
      );
    }
    if (name !== entry.name) {
      throw new Error(
        `${skillPath}: frontmatter name "${name}" does not match directory "${entry.name}"`
      );
    }

    const displayName = displayNameFor(name, frontmatter.metadata);
    const role = roleFor(name, category, frontmatter.metadata);
    const catalogDescription = descriptionFor(name, description, frontmatter.metadata);
    if (!ROLE_ORDER.includes(role)) {
      throw new Error(
        `${skillPath}: metadata.catalog_role must be one of ${ROLE_ORDER.join(", ")}`
      );
    }

    skills.push({
      name,
      displayName,
      version,
      role,
      description: catalogDescription,
    });
  }

  if (skills.length === 0) throw new Error(`No skill packages found in ${skillsDir}`);
  return skills.sort(
    (a, b) =>
      ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || compareCodePoints(a.name, b.name)
  );
}

function quote(value) {
  return JSON.stringify(value);
}

function renderGeneratedArray(skills) {
  const lines = [
    GENERATED_START,
    "  // Generated by scripts/sync-skills-catalog.mjs — do not edit between markers.",
  ];
  for (const skill of skills) {
    lines.push(
      "  {",
      `    name: ${quote(skill.name)},`,
      `    displayName: ${quote(skill.displayName)},`,
      `    version: ${quote(skill.version)},`,
      `    role: ${quote(skill.role)},`,
      "    description:",
      `      ${quote(skill.description)},`,
      `    githubUrl: \`\${SKILLS_BASE_URL}/${skill.name}/SKILL.md\`,`,
      "  },"
    );
  }
  lines.push(GENERATED_END);
  return lines.join("\n");
}

function replaceGeneratedArray(source, generated) {
  const start = source.indexOf(GENERATED_START);
  const end = source.indexOf(GENERATED_END);
  if (start < 0 || end < 0 || end < start) {
    throw new Error(
      `Catalog markers not found. Add ${GENERATED_START} and ${GENERATED_END} inside PUBLIC_MERMAID_SKILLS.`
    );
  }
  const endOffset = end + GENERATED_END.length;
  return `${source.slice(0, start)}${generated}${source.slice(endOffset)}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const skillsDir = resolve(ROOT, args.skillsDir);
  const outputPath = resolve(ROOT, args.output);
  const skills = await discoverSkills(skillsDir);
  const source = readFileSync(outputPath, "utf8");
  const next = replaceGeneratedArray(source, renderGeneratedArray(skills));

  if (args.check) {
    if (next !== source) {
      console.error(
        `Skill catalog drift detected: ${args.output} does not match ${args.skillsDir}.`
      );
      process.exitCode = 1;
      return;
    }
    console.log(`Skill catalog is current: ${skills.length} skills.`);
    return;
  }

  if (next === source) {
    console.log(`Skill catalog is current: ${skills.length} skills.`);
    return;
  }
  writeFileSync(outputPath, next, "utf8");
  console.log(`Updated ${args.output} from ${skillsDir}: ${skills.length} skills.`);
}

try {
  await main();
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exitCode = 1;
}
