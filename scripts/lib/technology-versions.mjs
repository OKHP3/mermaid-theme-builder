// Reads pnpm's generated v9 layout, not arbitrary YAML. Unknown layouts fail.
const unquote = (value) => value.replace(/^['"]|['"]$/g, "");

export function stableVersion(value) {
  return String(value ?? "").match(/^v?(\d+\.\d+\.\d+)$/)?.[1] ?? null;
}

export function compareVersions(a, b) {
  const left = stableVersion(a)?.split(".").map(Number);
  const right = stableVersion(b)?.split(".").map(Number);
  if (!left || !right) throw new Error(`Cannot compare stable versions: ${a}, ${b}`);
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

export function versionStatus(current, latest) {
  if (!current || !stableVersion(latest)) return "unknown";
  if (!stableVersion(current)) return "prerelease-in-use";
  const order = compareVersions(current, latest);
  return order < 0 ? "update-available" : order > 0 ? "ahead-of-latest" : "current";
}

export function actionStatus(current, latest) {
  const channel = current.match(/^v(\d+)(?:\.(\d+))?$/);
  if (channel && stableVersion(latest)) {
    const parts = stableVersion(latest).split(".").map(Number);
    const order =
      Number(channel[1]) - parts[0] ||
      (channel[2] === undefined ? 0 : Number(channel[2]) - parts[1]);
    return order < 0 ? "update-available" : order > 0 ? "ahead-of-latest" : "tracking-latest-major";
  }
  return stableVersion(current) ? versionStatus(current, latest) : "unknown";
}

export function parseLockfile(text) {
  if (!/^lockfileVersion: ['"]?9\.0['"]?\s*$/m.test(text))
    throw new Error("Unsupported pnpm lockfile version");
  const importers = {};
  const packages = [];
  let section, importer, dependency;
  for (const line of text.split(/\r?\n/)) {
    if (/^\S/.test(line)) section = line.split(":")[0];
    const key = line.match(/^  (\S.*?):(?:\s*\{\})?\s*$/)?.[1];
    if (section === "importers") {
      if (key) {
        importer = unquote(key);
        importers[importer] = {};
        dependency = null;
      }
      const name = line.match(/^      (\S.*?):\s*$/)?.[1];
      if (name) dependency = unquote(name);
      const version = line.match(/^        version: (.+)$/)?.[1];
      if (version && dependency && importer)
        importers[importer][dependency] = unquote(version).split("(")[0];
    }
    if (section === "packages" && key) {
      const record = unquote(key).match(
        /^(.+)@(\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?)(?:\(.*\))?$/
      );
      if (!record) throw new Error(`Unsupported lockfile package key: ${key}`);
      packages.push({ name: record[1], current: record[2] });
    }
  }
  if (!Object.keys(importers).length) throw new Error("No lockfile importers found");
  if (!packages.length) throw new Error("No lockfile packages found");
  return { importers, packages };
}

export function registryUrl(name) {
  return `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`;
}

export async function mapLimit(items, task, limit = 8) {
  let next = 0;
  const results = new Array(items.length);
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await task(items[index]);
      }
    })
  );
  return results;
}

export async function auditPackages(rows, getJson) {
  const cache = new Map();
  return mapLimit(rows, async (row) => {
    const source = registryUrl(row.name);
    try {
      if (!cache.has(row.name))
        cache.set(
          row.name,
          (async () => {
            const tagged = await getJson(source);
            if (stableVersion(tagged.version)) return tagged;
            const all = await getJson(source.replace(/\/latest$/, ""));
            if (!all.versions) throw new Error("Registry version history is unavailable");
            const version = Object.keys(all.versions ?? {})
              .filter(stableVersion)
              .sort((a, b) => compareVersions(b, a))[0];
            if (!version)
              return { version: null, latestTag: tagged.version, noStableRelease: true };
            return {
              ...all.versions[version],
              version,
              selection: "Highest stable version; latest tag is a prerelease",
            };
          })()
        );
      const metadata = await cache.get(row.name);
      if (metadata.noStableRelease)
        return {
          ...row,
          latest: null,
          latestTag: metadata.latestTag,
          status: "no-stable-release",
          source,
          selection:
            "All published versions use prerelease suffixes; review publisher convention manually",
        };
      const latest = stableVersion(metadata.version);
      if (!latest)
        throw new Error(
          "Registry latest tag is missing or a prerelease; manual source review required"
        );
      const status = versionStatus(row.current, latest);
      return {
        ...row,
        latest,
        status,
        source,
        selection: metadata.selection ?? "Stable latest tag",
        latestNodeEngine: metadata.engines?.node ?? null,
        ...(status === "unknown"
          ? { error: "No exact lockfile resolution for this declaration" }
          : {}),
      };
    } catch (error) {
      return { ...row, latest: null, status: "error", source, error: error.message };
    }
  });
}

export const needsReview = (row) =>
  [
    "update-available",
    "prerelease-in-use",
    "no-stable-release",
    "ahead-of-latest",
    "unknown",
    "error",
  ].includes(row.status);

function table(headers, rows) {
  const cell = (value) =>
    String(value ?? "unknown")
      .replaceAll("|", "\\|")
      .replace(/[\r\n]/g, " ");
  return [headers, headers.map(() => "---"), ...rows]
    .map((row) => `| ${row.map(cell).join(" | ")} |`)
    .join("\n");
}

export function renderMarkdown(report, { full = true } = {}) {
  const latestLabel = (row) =>
    row.status === "no-stable-release"
      ? `No stable SemVer release; latest tag ${row.latestTag ?? "unknown"}`
      : row.latest;
  const sections = [
    "# Technology version report",
    "",
    `Retrieved: ${report.generatedAt}. Source commit: ${report.sourceCommit}.`,
    report.sourceDirty
      ? "The source commit is the baseline; uncommitted maintenance changes are included in this report."
      : "Source checkout was clean when measured.",
    "",
    "Current npm versions are lockfile resolutions, not a claim about every host's installed modules. Latest means the publisher's stable npm latest tag or official release feed. Unknowns and ahead-of-latest results require review; they never trigger downgrades.",
    "",
    `Summary: ${JSON.stringify(report.summary)}`,
    "",
    "## Runtimes and package manager",
    "",
    table(
      ["Technology", "Declared / running here", "Latest stable", "Status", "Source"],
      report.runtimes.map((r) => [
        r.name,
        `${r.declared ?? "unversioned"} / ${r.running ?? "not observed"}`,
        r.latest,
        r.status,
        r.source,
      ])
    ),
    "",
    "## GitHub Actions (including composite actions)",
    "",
    table(
      ["Action", "Reference", "Latest release", "Status", "File"],
      report.actions.map((r) => [`[${r.name}](${r.source})`, r.current, r.latest, r.status, r.file])
    ),
    "",
    "## Direct dependencies in all repository manifests",
    "",
    table(
      ["Package", "Resolved", "Latest stable", "Status", "Manifest"],
      report.npm
        .filter((r) => full || needsReview(r))
        .map((r) => [`[${r.name}](${r.source})`, r.current, r.latest, r.status, r.manifest])
    ),
    "",
    "## Unused workspace catalog entries",
    "",
    "These are declarations, not evidence that the app uses these packages.",
    "",
    table(
      ["Package", "Declared range", "Latest stable", "Source"],
      report.catalogOnly.map((r) => [r.name, r.specifier, r.latest, r.source])
    ),
  ];
  if (full)
    sections.push(
      "",
      "## Internal packages",
      "",
      table(
        ["Manifest", "Name", "Internal version"],
        report.manifests.map((r) => [r.path, r.name, r.version])
      ),
      "",
      "## Complete lockfile package inventory",
      "",
      "Includes direct, transitive, and optional platform packages. Upgrade through their parents and regenerate the lockfile; do not force every transitive package to its latest major.",
      "",
      table(
        ["Package", "Resolved", "Latest stable", "Status"],
        report.transitive.map((r) => [
          `[${r.name}](${r.source})`,
          r.current,
          latestLabel(r),
          r.status,
        ])
      )
    );
  if (report.errors?.length)
    sections.push("", "## Audit errors", "", ...report.errors.map((error) => `- ${error}`));
  return sections.join("\n") + "\n";
}
