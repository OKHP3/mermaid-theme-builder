import assert from "node:assert/strict";
import test from "node:test";
import {
  parseLockfile,
  versionStatus,
  stableVersion,
  actionStatus,
  auditPackages,
  renderMarkdown,
} from "./lib/technology-versions.mjs";

test("lockfile importer isolation, scoped keys, peers, empty workspace, and multiple resolutions", () => {
  const lock = parseLockfile(`lockfileVersion: '9.0'
importers:
  .:
    dependencies:
      '@scope/ui':
        specifier: 'catalog:'
        version: 1.2.3(react@19.0.0)
  artifacts/empty: {}
  artifacts/demo:
    devDependencies:
      '@scope/ui':
        specifier: ^2.0.0
        version: 2.0.1
packages:
  '@scope/ui@1.2.3':
    resolution: {integrity: abc}
  '@scope/ui@2.0.1': {}
  helper@1.0.0-beta.2: {}
snapshots:
  '@scope/ui@1.2.3(react@19.0.0)': {}
`);
  assert.equal(lock.importers["."]["@scope/ui"], "1.2.3");
  assert.equal(lock.importers["artifacts/demo"]["@scope/ui"], "2.0.1");
  assert.deepEqual(lock.importers["artifacts/empty"], {});
  assert.equal(lock.packages.length, 3);
  assert.equal(lock.packages[2].current, "1.0.0-beta.2");
});

test("unsupported lockfile versions and malformed package records fail visibly", () => {
  assert.throws(() => parseLockfile("lockfileVersion: '10.0'\n"), /Unsupported/);
  assert.throws(
    () => parseLockfile("lockfileVersion: '9.0'\nimporters:\n  .: {}\npackages:\n  surprise: {}\n"),
    /package key/
  );
});

test("only stable versions compare; missing versions and ahead versions cannot become upgrades", () => {
  assert.equal(stableVersion("1.2.3-rc.1"), null);
  assert.equal(versionStatus(null, "1.2.3"), "unknown");
  assert.equal(versionStatus("2.0.0", "1.9.9"), "ahead-of-latest");
  assert.equal(versionStatus("1.2.9", "1.2.10"), "update-available");
  assert.equal(versionStatus("1.2.3", "1.2.3"), "current");
  assert.equal(versionStatus("1.2.3-beta.1", "1.2.3"), "prerelease-in-use");
});

test("floating action refs are channels, not installed patch versions", () => {
  assert.equal(actionStatus("v6", "v6.1.2"), "tracking-latest-major");
  assert.equal(actionStatus("v5", "v6.1.2"), "update-available");
  assert.equal(actionStatus("v6.0.1", "v6.1.2"), "update-available");
  assert.equal(actionStatus("main", "v6.1.2"), "unknown");
  assert.equal(actionStatus("v7", "v6.1.2"), "ahead-of-latest");
});

test("network failures, prerelease latest tags, and missing locks cannot report a clean audit", async () => {
  const rows = [
    { name: "offline", current: "1.0.0" },
    { name: "preview", current: "1.0.0" },
    { name: "missing", current: null },
  ];
  const results = await auditPackages(rows, async (url) => {
    if (url.includes("offline")) throw new Error("network unavailable");
    return { version: url.includes("preview") ? "2.0.0-rc.1" : "1.0.0" };
  });
  assert.deepEqual(
    results.map((r) => r.status),
    ["error", "error", "unknown"]
  );
  assert.ok(results.every((r) => r.error));
});

test("report renders missing versions explicitly and escapes table cells", () => {
  const markdown = renderMarkdown({
    generatedAt: "2026-09-18",
    sourceCommit: "abc",
    summary: { errors: 1 },
    runtimes: [],
    actions: [],
    catalogOnly: [],
    manifests: [],
    npm: [
      {
        name: "demo",
        current: null,
        latest: "1.0.0",
        status: "unknown",
        manifest: "a|b",
        source: "https://registry.npmjs.org/demo/latest",
      },
    ],
    transitive: [],
  });
  assert.match(markdown, /unknown/);
  assert.match(markdown, /a\\\|b/);
});

test("a prerelease latest tag falls back to the highest published stable version", async () => {
  const rows = await auditPackages([{ name: "demo", current: "1.0.0" }], async (url) =>
    url.endsWith("/latest")
      ? { version: "2.0.0-beta.1" }
      : { versions: { "1.2.9": {}, "1.2.10": {}, "2.0.0-beta.1": {} } }
  );
  assert.equal(rows[0].latest, "1.2.10");
  assert.equal(rows[0].status, "update-available");
});

test("a package that only publishes suffixed versions is an explicit review item", async () => {
  const rows = await auditPackages([{ name: "demo", current: "1.0.0-0" }], async (url) =>
    url.endsWith("/latest")
      ? { version: "2.0.0-0" }
      : { versions: { "1.0.0-0": {}, "2.0.0-0": {} } }
  );
  assert.equal(rows[0].latest, null);
  assert.equal(rows[0].latestTag, "2.0.0-0");
  assert.equal(rows[0].status, "no-stable-release");
  assert.equal(rows[0].error, undefined);
});
