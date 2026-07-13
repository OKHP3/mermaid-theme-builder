#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const args = new Set(process.argv.slice(2));
const root = process.cwd();
const packageJson = JSON.parse(readFileSync(`${root}/package.json`, "utf8"));

function readOptional(path) {
  try {
    return readFileSync(`${root}/${path}`, "utf8");
  } catch {
    return "";
  }
}

function getInstalledVersions() {
  const lockfile = readOptional("pnpm-lock.yaml");
  const packagesMarker = lockfile.indexOf("\n\npackages:");
  const importer = packagesMarker >= 0 ? lockfile.slice(0, packagesMarker) : lockfile;
  const versions = {};

  for (const { name } of declaredPackages) {
    const yamlKey = name.startsWith("@") ? `'${name}'` : name;
    const escapedKey = yamlKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = importer.match(
      new RegExp(
        `^      ${escapedKey}:\\r?\\n        specifier: [^\\r\\n]+\\r?\\n        version: ([^\\r\\n]+)\\r?$`,
        "m"
      )
    );
    versions[name] = match?.[1]?.match(/\d+\.\d+\.\d+/)?.[0];
  }

  return versions;
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "mermaid-theme-builder-version-audit" },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${url}`);
  }
  return response.json();
}

function registryUrl(packageName) {
  return `https://registry.npmjs.org/${packageName
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}/latest`;
}

function parseVersion(value) {
  const match = String(value).match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function compareVersions(left, right) {
  const a = parseVersion(left) ?? [0, 0, 0];
  const b = parseVersion(right) ?? [0, 0, 0];
  return b[0] - a[0] || b[1] - a[1] || b[2] - a[2];
}

function semverStatus(current, latest) {
  if (!current || !latest) return "unknown";
  return current === latest ? "current" : "update-available";
}

function getManagedPnpmVersion() {
  const commands = ["corepack pnpm --version", "pnpm --version"];

  for (const command of commands) {
    try {
      return execSync(command, { encoding: "utf8" }).trim();
    } catch {
      // Try the next available package-manager command.
    }
  }

  return null;
}

const declaredPackages = [
  ...Object.entries(packageJson.dependencies ?? {}).map(([name, specifier]) => ({
    name,
    kind: "dependency",
    specifier,
  })),
  ...Object.entries(packageJson.devDependencies ?? {}).map(([name, specifier]) => ({
    name,
    kind: "devDependency",
    specifier,
  })),
];

const installedVersions = getInstalledVersions();
const npmResults = await Promise.all(
  declaredPackages.map(async ({ name, kind, specifier }) => {
    try {
      const metadata = await getJson(registryUrl(name));
      const latest = metadata.version;
      const current = installedVersions[name];
      return {
        name,
        kind,
        specifier,
        current,
        latest,
        status: semverStatus(current, latest),
        source: `https://www.npmjs.com/package/${name}`,
      };
    } catch (error) {
      return {
        name,
        kind,
        specifier,
        current: installedVersions[name],
        latest: null,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })
);

const packageManagerMatch = String(packageJson.packageManager ?? "").match(
  /^pnpm@(\d+\.\d+\.\d+)$/
);
let pnpmLatest = null;
let pnpmError = null;
try {
  pnpmLatest = (await getJson(registryUrl("pnpm"))).version;
} catch (error) {
  pnpmError = error instanceof Error ? error.message : String(error);
}

let nodeReleases = [];
let nodeError = null;
try {
  nodeReleases = await getJson("https://nodejs.org/dist/index.json");
} catch (error) {
  nodeError = error instanceof Error ? error.message : String(error);
}

const nodeMajor = readOptional(".replit").match(/nodejs-(\d+)/)?.[1] ?? null;
const stableNodeReleases = nodeReleases.filter((release) =>
  /^v\d+\.\d+\.\d+$/.test(release.version)
);
const latestNode = stableNodeReleases[0]?.version ?? null;
const latestNodeLts = stableNodeReleases.find((release) => release.lts)?.version ?? null;
const latestNodeForDeclaredMajor = nodeMajor
  ? (stableNodeReleases.find((release) => release.version.startsWith(`v${nodeMajor}.`))?.version ??
    null)
  : null;

let pythonReleases = [];
let pythonError = null;
try {
  pythonReleases = await getJson(
    "https://www.python.org/api/v2/downloads/release/?is_published=true&pre_release=false"
  );
} catch (error) {
  pythonError = error instanceof Error ? error.message : String(error);
}

const stablePythonVersions = pythonReleases
  .map((release) => release.name?.match(/^Python (3\.\d+\.\d+)$/)?.[1])
  .filter(Boolean)
  .sort(compareVersions);
const latestPython = stablePythonVersions[0] ?? null;
const pythonMajor = readOptional(".replit").match(/python-(\d+\.\d+)/)?.[1] ?? null;

const errors = [
  pnpmError,
  nodeError,
  pythonError,
  ...npmResults.filter((result) => result.status === "error").map((result) => result.error),
].filter(Boolean);

const report = {
  generatedAt: new Date().toISOString(),
  packageManager: {
    declared: packageManagerMatch?.[1] ?? null,
    installed: getManagedPnpmVersion(),
    latest: pnpmLatest,
    status: semverStatus(packageManagerMatch?.[1], pnpmLatest),
    source: "https://www.npmjs.com/package/pnpm",
  },
  runtimes: {
    node: {
      declaredMajor: nodeMajor,
      running: process.version,
      latestStable: latestNode,
      latestLts: latestNodeLts,
      latestForDeclaredMajor: latestNodeForDeclaredMajor,
      source: "https://nodejs.org/en/about/previous-releases",
    },
    python: {
      declaredMajorMinor: pythonMajor,
      latestStable: latestPython,
      source: "https://www.python.org/downloads/",
      note: "Python is provisioned by Replit only. This repository contains no Python source or package manifest.",
    },
  },
  npm: npmResults.sort((left, right) => left.name.localeCompare(right.name)),
  summary: {
    outdatedNpm: npmResults.filter((result) => result.status === "update-available").length,
    npmErrors: npmResults.filter((result) => result.status === "error").length,
    runtimeErrors: errors.length,
  },
  errors,
};

if (args.has("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Technology version audit: ${report.generatedAt}`);
  console.log(
    `\nPackage manager: pnpm ${report.packageManager.declared ?? "unknown"} declared, ${report.packageManager.latest ?? "unknown"} latest`
  );
  console.log(
    `Node.js: ${report.runtimes.node.declaredMajor ?? "unknown"} declared, ${report.runtimes.node.latestLts ?? "unknown"} latest LTS`
  );
  console.log(
    `Python: ${report.runtimes.python.declaredMajorMinor ?? "not declared"} declared by Replit, ${report.runtimes.python.latestStable ?? "unknown"} latest stable`
  );
  console.log("\nDirect npm packages:");
  for (const result of report.npm) {
    console.log(
      `${result.name.padEnd(46)} ${String(result.current ?? "unknown").padEnd(12)} ${String(result.latest ?? "unknown").padEnd(12)} ${result.status}`
    );
  }
}

if (
  args.has("--fail-on-outdated") &&
  (report.summary.outdatedNpm > 0 || report.packageManager.status === "update-available")
) {
  process.exitCode = 1;
}
if (args.has("--fail-on-errors") && report.errors.length > 0) {
  process.exitCode = 1;
}
