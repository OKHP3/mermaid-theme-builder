import { compareVersions, stableVersion } from "./technology-versions.mjs";

// Follow the vendor's stable distribution tag, never an arbitrary highest tag.
export function selectStableRelease(metadata, now = Date.now(), minimumAgeDays = 3) {
  const version = stableVersion(metadata["dist-tags"]?.latest);
  if (!version) throw new Error("Vendor latest tag is not a stable release");
  const release = metadata.versions?.[version];
  if (!release || release.deprecated) throw new Error("Stable release is missing or deprecated");
  const published = Date.parse(metadata.time?.[version]);
  if (!Number.isFinite(published)) throw new Error("Stable release has no publication date");
  // If today's stable tag is cooling down, still take an older eligible patch.
  // Never jump past the official stable tag into a future release line.
  return (
    Object.keys(metadata.versions)
      .filter(
        (candidate) =>
          stableVersion(candidate) &&
          compareVersions(candidate, version) <= 0 &&
          !metadata.versions[candidate].deprecated &&
          Number.isFinite(Date.parse(metadata.time?.[candidate])) &&
          now - Date.parse(metadata.time[candidate]) >= minimumAgeDays * 86400000
      )
      .sort((a, b) => compareVersions(b, a))[0] ?? null
  );
}

export function exactUpdate(current, latest) {
  if (!latest) return null;
  const baseline = stableVersion(current.replace(/^[~^]/, ""));
  if (!baseline) throw new Error(`Unsupported dependency selector: ${current}`);
  if (compareVersions(latest, baseline) < 0) return null;
  return latest === current ? null : latest;
}

export function updateCatalog(source, versions) {
  const block = source.match(/^catalog:\s*\r?\n([\s\S]*?)(?=^\S|$(?![\s\S]))/m);
  if (!block) throw new Error("Expected one default workspace catalog");
  const found = new Set();
  const updated = block[0].replace(
    /^  (["']?)([^"':]+)\1:\s*(.+)$/gm,
    (line, quote, name, current) => {
      if (!versions.has(name)) return line;
      found.add(name);
      const next = exactUpdate(current.trim(), versions.get(name));
      return next ? `  ${quote}${name}${quote}: ${next}` : line;
    }
  );
  for (const name of versions.keys()) {
    if (!found.has(name)) throw new Error(`Missing catalog declaration: ${name}`);
  }
  return source.replace(block[0], updated);
}
