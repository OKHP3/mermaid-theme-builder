#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mapLimit, stableVersion, compareVersions } from "./lib/technology-versions.mjs";
import { exactUpdate, selectStableRelease, updateCatalog } from "./lib/foundation-updates.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--apply"))
  throw new Error("Usage: update-foundation.mjs [--apply]");
const apply = args.includes("--apply");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0");
const manifests = files
  .filter((file) => /(^|\/)package\.json$/.test(file))
  .map((file) => ({
    file,
    original: read(file),
    value: JSON.parse(read(file)),
  }));
const kinds = ["dependencies", "devDependencies", "optionalDependencies"];
const names = [
  ...new Set([
    "pnpm",
    ...manifests.flatMap(({ value }) => kinds.flatMap((kind) => Object.keys(value[kind] ?? {}))),
  ]),
];
async function getJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}
// Resolve every source before writing anything. A lookup error fails closed.
const versions = new Map(
  await mapLimit(names, async (name) => [
    name,
    selectStableRelease(await getJson(`https://registry.npmjs.org/${encodeURIComponent(name)}`)),
  ])
);
const catalog = new Map();
const pending = new Map();
for (const { file, original, value } of manifests) {
  for (const kind of kinds)
    for (const [name, current] of Object.entries(value[kind] ?? {})) {
      if (current === "catalog:") {
        catalog.set(name, versions.get(name));
        continue;
      }
      if (/^(workspace:|file:|link:)/.test(current)) continue;
      const next = exactUpdate(current, versions.get(name));
      if (next) value[kind][name] = next;
    }
  if (file === "package.json") {
    const current = value.packageManager.replace(/^pnpm@/, "");
    const next = exactUpdate(current, versions.get("pnpm"));
    if (next) value.packageManager = `pnpm@${next}`;
  }
  const updated = JSON.stringify(value, null, 2) + "\n";
  if (updated.replace(/\r/g, "") !== original.replace(/\r/g, "")) pending.set(file, updated);
}
const workspace = read("pnpm-workspace.yaml");
const updatedWorkspace = updateCatalog(workspace, catalog);
if (workspace !== updatedWorkspace) pending.set("pnpm-workspace.yaml", updatedWorkspace);

const nodeReleases = await getJson("https://nodejs.org/dist/index.json");
const node = nodeReleases
  .filter(
    (release) =>
      release.lts &&
      stableVersion(release.version) &&
      Date.now() - Date.parse(release.date) >= 3 * 86400000
  )
  .sort((a, b) => compareVersions(b.version, a.version))[0];
if (!node) throw new Error("No stable, aged Node LTS release found");
const nodeVersion = stableVersion(node.version);
const currentNode = read(".node-version").trim();
if (exactUpdate(currentNode, nodeVersion)) pending.set(".node-version", nodeVersion + "\n");

const pythonReleases = await getJson(
  "https://www.python.org/api/v2/downloads/release/?is_published=true&pre_release=false"
);
if (!Array.isArray(pythonReleases)) throw new Error("Unexpected Python release feed");
const python = pythonReleases
  .filter(
    (release) =>
      !release.pre_release && Date.now() - Date.parse(release.release_date) >= 3 * 86400000
  )
  .map((release) => release.name?.match(/^Python (3\.\d+\.\d+)$/)?.[1])
  .filter(Boolean)
  .sort((a, b) => compareVersions(b, a))[0];
if (!python) throw new Error("No stable, aged Python release found");
if (exactUpdate(read(".python-version").trim(), python))
  pending.set(".python-version", python + "\n");

for (const [file, content] of pending) {
  console.log(`${apply ? "UPDATE" : "PROPOSE"} ${file}`);
  if (apply) writeFileSync(resolve(root, file), content);
}
console.log(`${pending.size} file(s). Stable vendor tags only; three-day cooldown; no downgrades.`);
console.log(
  "Regenerate the lockfile with the pinned pnpm, review Mermaid capabilities, then run all checks. This script never merges or marks a renderer verified."
);
