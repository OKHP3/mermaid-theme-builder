#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const roots = process.argv.slice(2).filter((arg) => arg !== '--json');
const json = process.argv.includes('--json');
const scanRoots = roots.length ? roots : ['.agents/skills', 'skills'];
const allowed = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);
const problems = [];
const warnings = [];

function readFrontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith('---\n')) return { text, fields: null };
  const end = text.indexOf('\n---', 4);
  if (end < 0) return { text, fields: null };
  const fields = {};
  for (const line of text.slice(4, end).split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) fields[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return { text, fields };
}

function skillDirs(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, entry.name, 'SKILL.md')))
    .map((entry) => path.join(root, entry.name));
}

for (const root of scanRoots) {
  for (const dir of skillDirs(root)) {
    const file = path.join(dir, 'SKILL.md');
    const { text, fields } = readFrontmatter(file);
    const name = path.basename(dir);
    if (!fields) problems.push(`${file}: missing valid YAML frontmatter`);
    else {
      for (const key of Object.keys(fields)) if (!allowed.has(key)) problems.push(`${file}: non-portable top-level field ${key}`);
      if (fields.name !== name) problems.push(`${file}: name must match directory`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) problems.push(`${file}: invalid skill name`);
      if (!fields.description || fields.description.length > 1024) problems.push(`${file}: description missing or over 1024 characters`);
    }
    if (text.split('\n').length > 500) warnings.push(`${file}: body exceeds 500 lines`);
    if (text.includes(String.fromCodePoint(0x2014)) || text.includes(String.fromCodePoint(0x2013))) problems.push(`${file}: forbidden dash punctuation`);
    for (const folder of ['references', 'scripts', 'assets']) {
      const target = path.join(dir, folder);
      if (fs.existsSync(target)) {
        for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
          if (entry.isDirectory() && fs.existsSync(path.join(target, entry.name, 'SKILL.md'))) problems.push(`${file}: nested skill package`);
        }
      }
    }
    if (!/##\s+Scope/i.test(text)) warnings.push(`${file}: missing explicit Scope section`);
    if (!/##\s+(Validation|Output validation)/i.test(text)) warnings.push(`${file}: missing explicit validation section`);
  }
}

const result = { roots: scanRoots, skills: scanRoots.flatMap(skillDirs).length, errors: problems, warnings };
if (json) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Validated ${result.skills} skill directories.`);
  console.log(`Summary: ${problems.length} errors, ${warnings.length} warnings.`);
  for (const item of [...problems, ...warnings]) console.log(item);
}
process.exitCode = problems.length ? 1 : 0;
