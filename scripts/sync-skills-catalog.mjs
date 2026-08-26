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

function displayNameFor(name, metadata) {
  if (metadata.catalog_display_name) return metadata.catalog_display_name;
  const label = name
    .replace(/^okhp3-/, "")
    .replace(/^mermaid-/, "")
    .split("-")
    .map((word) => (word.toLowerCase() === "bpmn" ? "BPMN" : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
  return label || name;
}

function roleFor(category, metadata) {
  if (metadata.catalog_role) return metadata.catalog_role;
  if (category === "diagramming") return "domain";
  if (category === "workflow") return "workflow";
  if (category === "governance") return "governance";
  return "tooling";
}

function descriptionFor(description, metadata) {
  if (metadata.catalog_description) return metadata.catalog_description;
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
    const role = roleFor(category, frontmatter.metadata);
    const catalogDescription = descriptionFor(description, frontmatter.metadata);
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
