import assert from "node:assert/strict";
import test from "node:test";
import { exactUpdate, selectStableRelease, updateCatalog } from "./lib/foundation-updates.mjs";

const now = Date.parse("2026-11-03T00:00:00Z");
const metadata = {
  "dist-tags": { latest: "12.2.0" },
  versions: { "12.2.0": {} },
  time: { "12.2.0": "2026-10-13T00:00:00Z" },
};
test("selects only the official stable tag after the cooldown", () => {
  assert.equal(selectStableRelease(metadata, now), "12.2.0");
  assert.equal(
    selectStableRelease({ ...metadata, time: { "12.2.0": "2026-11-02T00:00:00Z" } }, now),
    null
  );
});
test("rejects prereleases, deprecated releases and incomplete metadata", () => {
  assert.throws(() =>
    selectStableRelease({ ...metadata, "dist-tags": { latest: "13.0.0-beta.1" } }, now)
  );
  assert.throws(() =>
    selectStableRelease({ ...metadata, versions: { "12.2.0": { deprecated: "retired" } } }, now)
  );
  assert.throws(() => selectStableRelease({ ...metadata, time: {} }, now));
});
test("takes an eligible stable patch while the newest tag cools down", () => {
  assert.equal(
    selectStableRelease(
      {
        "dist-tags": { latest: "5.1.0" },
        versions: { "5.1.0": {}, "5.0.5": {}, "6.0.0-beta.1": {}, "6.0.0": {} },
        time: {
          "5.1.0": "2026-11-02",
          "5.0.5": "2026-10-15",
          "6.0.0-beta.1": "2026-10-01",
          "6.0.0": "2026-10-01",
        },
      },
      now
    ),
    "5.0.5"
  );
});
test("pins stable ranges, does not downgrade and refuses unknown selectors", () => {
  assert.equal(exactUpdate("^12.0.0", "12.2.0"), "12.2.0");
  assert.equal(exactUpdate("12.2.0", "12.2.0"), null);
  assert.equal(exactUpdate("12.2.0", "12.1.0"), null);
  assert.equal(exactUpdate("12.2.0", null), null);
  assert.throws(() => exactUpdate("latest", "12.2.0"));
});
test("changes only actual catalog users and fails on missing entries", () => {
  const source = 'catalog:\n  "react": ^19.0.0\n  unused: ^1.0.0\n\nautoInstallPeers: false\n';
  assert.equal(
    updateCatalog(source, new Map([["react", "19.3.1"]])),
    source.replace("^19.0.0", "19.3.1")
  );
  assert.throws(() => updateCatalog(source, new Map([["missing", "1.0.0"]])));
});
