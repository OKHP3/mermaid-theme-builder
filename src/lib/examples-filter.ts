/**
 * Shared data and filter logic for the Examples tab.
 *
 * Extracted so the assembled example list and the search predicate can be
 * imported by both ExamplesTab.tsx (production) and unit tests, ensuring the
 * tests exercise exactly the same code path that runs in the browser.
 */

import { BRAND_PALETTES } from "@/lib/palettes";
import { BRAND_EXAMPLES, SHOWCASE_EXAMPLE, SHOWCASE_META } from "@/data/examples";
import { EXAMPLE_GROUPS } from "@/data/example-library";

export interface ExampleItem {
  id: string;
  label: string;
  content: string;
  badge?: string;
  section: string;
  family?: string;
  description?: string;
  tags?: string[];
}

/** Build the full assembled list: brand palette previews, showcase, and catalog entries. */
export function buildExampleList(): ExampleItem[] {
  const items: ExampleItem[] = [];

  BRAND_PALETTES.forEach((p) => {
    const ex = BRAND_EXAMPLES[p.id];
    if (!ex) return;
    items.push({
      id: `brand-${p.id}-flow`,
      label: `${p.name} — Flowchart`,
      content: ex.flowchart,
      badge: "Brand",
      section: "OKHP3 Brand & Showcase",
      family: "flowchart",
    });
    if (ex.sequence) {
      items.push({
        id: `brand-${p.id}-seq`,
        label: `${p.name} — Sequence`,
        content: ex.sequence,
        badge: "Brand",
        section: "OKHP3 Brand & Showcase",
        family: "sequence",
      });
    }
  });

  items.push({
    id: "showcase",
    label: SHOWCASE_META.title,
    content: SHOWCASE_EXAMPLE,
    badge: "Advanced / renderer-dependent",
    section: "OKHP3 Brand & Showcase",
  });

  EXAMPLE_GROUPS.forEach((group) => {
    group.entries.forEach((entry) => {
      items.push({
        id: entry.id,
        label: entry.label,
        content: entry.content,
        badge: entry.badge,
        section: group.label,
        family: entry.family,
        description: entry.description,
        tags: entry.tags,
      });
    });
  });

  return items;
}

/** The assembled list used by ExamplesTab. Module-level singleton. */
export const ALL_EXAMPLES = buildExampleList();

/** Section names derived from ALL_EXAMPLES. */
export const SECTIONS = Array.from(new Set(ALL_EXAMPLES.map((e) => e.section)));

/** Unique diagram families present in ALL_EXAMPLES. */
export const ALL_FAMILIES = Array.from(
  new Set(ALL_EXAMPLES.map((e) => e.family).filter((f): f is string => !!f))
).sort();

/**
 * Filter ALL_EXAMPLES by a free-text query.
 *
 * Matches against: label, family, badge, section, description, and tags.
 * An empty or whitespace-only query returns the full list unchanged.
 */
export function filterExamples(examples: ExampleItem[], query: string): ExampleItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return examples;
  return examples.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      (e.family ?? "").toLowerCase().includes(q) ||
      (e.badge ?? "").toLowerCase().includes(q) ||
      e.section.toLowerCase().includes(q) ||
      (e.description ?? "").toLowerCase().includes(q) ||
      (e.tags ?? []).some((t) => t.toLowerCase().includes(q))
  );
}
