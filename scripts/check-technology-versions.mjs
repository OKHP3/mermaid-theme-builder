#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseLockfile,
  stableVersion,
  compareVersions,
  versionStatus,
  actionStatus,
  auditPackages,
  registryUrl,
  mapLimit,
  needsReview,
  renderMarkdown,
} from "./lib/technology-versions.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const args = new Set(process.argv.slice(2));
const read = (file) => readFileSync(resolve(root, file), "utf8");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const files = git("ls-files", "-z").split("\0").filter(Boolean);
const manifests = files
  .filter((f) => /(^|\/)package\.json$/.test(f))
  .map((path) => ({ path, ...JSON.parse(read(path)) }));
const pkg = manifests.find((m) => m.path === "package.json");
const lock = parseLockfile(read("pnpm-lock.yaml"));
const errors = [];
const replit = read(".replit");

async function getJson(url) {
  // Retry once, bound all requests, and send a token only to GitHub's API.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const headers = {
        accept: "application/json",
        "user-agent": "mermaid-theme-builder-version-audit",
      };
      if (url.startsWith("https://api.github.com/") && process.env.GITHUB_TOKEN)
        headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
      return await response.json();
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }
}

const declared = manifests.flatMap((manifest) =>
  ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"].flatMap((kind) =>
    Object.entries(manifest[kind] ?? {}).map(([name, specifier]) => ({
      name,
      kind,
      specifier,
      manifest: manifest.path,
      current:
        lock.importers[
          manifest.path === "package.json" ? "." : manifest.path.replace(/\/package\.json$/, "")
        ]?.[name] ?? null,
    }))
  )
);
const catalogBlock =
  read("pnpm-workspace.yaml").match(/^catalog:\s*\r?\n([\s\S]*?)(?=^\S|$(?![\s\S]))/m)?.[1] ?? "";
const catalogOnly = [...catalogBlock.matchAll(/^  ["']?([^"':]+)["']?:\s*(.+)$/gm)]
  .filter((m) => !declared.some((r) => r.name === m[1]))
  .map((m) => ({ name: m[1], specifier: m[2].trim() }));
// One registry request per distinct name, reused for all importers and resolutions.
const metadata = new Map();
const cachedJson = (url) => {
  if (!metadata.has(url)) metadata.set(url, getJson(url));
  return metadata.get(url);
};
const npm = await auditPackages(declared, cachedJson);
const transitive = await auditPackages(lock.packages, cachedJson);
const catalogResults = await mapLimit(catalogOnly, async (row) => {
  try {
    const latest = stableVersion((await cachedJson(registryUrl(row.name))).version);
    if (!latest) throw new Error("No stable latest tag");
    return { ...row, latest, source: registryUrl(row.name) };
  } catch (error) {
    errors.push(`Catalog ${row.name}: ${error.message}`);
    return { ...row, latest: null };
  }
});

const runtimes = [];
async function runtime(name, declared, source, task) {
  try {
    runtimes.push({ name, declared, source, ...(await task()) });
  } catch (error) {
    runtimes.push({ name, declared, source, latest: null, status: "error", error: error.message });
  }
}
await runtime(
  "Nixpkgs / Replit channel",
  replit.match(/channel\s*=\s*"([^"]+)"/)?.[1],
  "https://nixos.org/manual/nixos/stable/release-notes",
  async () => {
    const response = await fetch("https://nixos.org/manual/nixos/stable/release-notes", {
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Nix channel lookup failed: ${response.status}`);
    const latest = (await response.text()).match(/Release\s+(\d+\.\d+)/)?.[1];
    if (!latest) throw new Error("Cannot resolve latest stable NixOS channel");
    const current = replit.match(/channel\s*=\s*"stable-(\d+_\d+)"/)?.[1]?.replace("_", ".");
    return {
      latest,
      status: current === latest ? "current" : "update-available",
      note: "Upstream NixOS release is not a guarantee of Replit channel availability. Review in Replit before updating.",
    };
  }
);
await runtime("pnpm", pkg.packageManager, registryUrl("pnpm"), async () => {
  const latest = stableVersion((await cachedJson(registryUrl("pnpm"))).version);
  if (!latest) throw new Error("No stable pnpm latest tag");
  return {
    latest,
    status: versionStatus(pkg.packageManager?.split("@")[1]?.split("+")[0], latest),
  };
});
await runtime(
  "Node.js",
  replit.match(/nodejs-(\d+)/)?.[1],
  "https://nodejs.org/dist/index.json",
  async () => {
    const releases = (await getJson("https://nodejs.org/dist/index.json"))
      .filter((r) => stableVersion(r.version))
      .sort((a, b) => compareVersions(b.version, a.version));
    const latest = releases[0]?.version;
    const latestLts = releases.find((r) => r.lts)?.version;
    const major = replit.match(/nodejs-(\d+)/)?.[1];
    const latestForDeclaredMajor = releases.find((r) =>
      r.version.startsWith(`v${major}.`)
    )?.version;
    if (!latest || !latestLts || !latestForDeclaredMajor)
      throw new Error("Incomplete Node release feed");
    return {
      running: process.version,
      latest,
      latestLts,
      latestForDeclaredMajor,
      status:
        Number(major) < Number(stableVersion(latestLts).split(".")[0])
          ? "update-available"
          : "tracking-lts-major",
      localStatus: versionStatus(process.version, latestForDeclaredMajor),
    };
  }
);
await runtime(
  "Python",
  replit.match(/python-(\d+\.\d+)/)?.[1],
  "https://www.python.org/api/v2/downloads/release/?is_published=true&pre_release=false",
  async () => {
    const data = await getJson(
      "https://www.python.org/api/v2/downloads/release/?is_published=true&pre_release=false"
    );
    if (!Array.isArray(data)) throw new Error("Unexpected or paginated Python release feed");
    const versions = data
      .map((r) => r.name?.match(/^Python (3\.\d+\.\d+)$/)?.[1])
      .filter(Boolean)
      .sort((a, b) => compareVersions(b, a));
    if (!versions.length) throw new Error("Empty stable Python release feed");
    const declared = replit.match(/python-(\d+\.\d+)/)?.[1];
    return {
      latest: versions[0],
      latestForDeclaredLine: versions.find((v) => v.startsWith(`${declared}.`)) ?? null,
      status:
        declared === versions[0].split(".").slice(0, 2).join(".")
          ? "tracking-stable-line"
          : "update-available",
      sourceFiles: files.filter((f) => f.endsWith(".py")),
      note: "Skill support scripts; no Python application backend. Exact Replit runtime is not measured by this audit.",
    };
  }
);

const actionRefs = files
  .filter((f) => /^\.github\/(workflows|actions)\/.+\.ya?ml$/.test(f))
  .flatMap((file) =>
    [...read(file).matchAll(/^\s*(?:- )?uses:\s*["']?([\w.-]+\/[\w./-]+)@([\w.+-]+)/gm)].map(
      (m) => ({ name: m[1], current: m[2], file })
    )
  );
const actionMetadata = new Map();
const actions = await mapLimit(actionRefs, async (row) => {
  const repo = row.name.split("/").slice(0, 2).join("/");
  const source = `https://github.com/${repo}/releases`;
  try {
    if (!actionMetadata.has(repo))
      actionMetadata.set(repo, getJson(`https://api.github.com/repos/${repo}/releases/latest`));
    const release = await actionMetadata.get(repo);
    if (release.prerelease || release.draft || !stableVersion(release.tag_name))
      throw new Error("No stable action release found");
    return {
      ...row,
      latest: release.tag_name,
      status: actionStatus(row.current, release.tag_name),
      source,
    };
  } catch (error) {
    return { ...row, latest: null, status: "error", source, error: error.message };
  }
});

for (const row of [...npm, ...transitive, ...runtimes, ...actions])
  if (row.error) errors.push(`${row.name}: ${row.error}`);
const uniqueErrors = [...new Set(errors)];
const report = {
  generatedAt: new Date().toISOString(),
  sourceCommit: git("rev-parse", "HEAD"),
  sourceDirty: Boolean(git("status", "--porcelain")),
  manifests: manifests.map(({ path, name, version }) => ({ path, name, version })),
  npm,
  transitive,
  catalogOnly: catalogResults,
  runtimes,
  actions,
  summary: {
    directDeclarations: npm.length,
    distinctDirectPackages: new Set(npm.map((r) => r.name)).size,
    lockfileResolutions: transitive.length,
    outdatedNpm: npm.filter((r) => r.status === "update-available").length,
    outdatedActions: actions.filter((r) => r.status === "update-available").length,
    runtimeReviews: runtimes.filter(needsReview).length,
    errors: uniqueErrors.length,
  },
  errors: uniqueErrors,
};

const outputIndex = process.argv.indexOf("--output-dir");
if (outputIndex !== -1) {
  const directory = process.argv[outputIndex + 1];
  if (!directory || directory.startsWith("--"))
    throw new Error("--output-dir requires a directory");
  mkdirSync(directory, { recursive: true });
  for (const [file, content] of [
    ["technology-version-report.json", JSON.stringify(report, null, 2) + "\n"],
    ["technology-version-report.md", renderMarkdown(report)],
    ["technology-version-summary.md", renderMarkdown(report, { full: false })],
  ])
    writeFileSync(resolve(directory, file), content);
}
console.log(
  args.has("--json") ? JSON.stringify(report, null, 2) : renderMarkdown(report, { full: false })
);
if (args.has("--fail-on-errors") && uniqueErrors.length) process.exitCode = 1;
if (args.has("--fail-on-outdated") && [...npm, ...runtimes, ...actions].some(needsReview))
  process.exitCode = 1;
