/**
 * Milestone heading content guard
 *
 * Purpose
 * -------
 * The "Architecture Hardening (V0.3)" section eyebrow, "What shipped in
 * v0.4 and v0.5" section heading, and "What shipped in v0.6" section heading
 * inside TIMELINE_PROJECT_HISTORY are the canonical milestone labels for the
 * project history timeline.  This test locks them in so that any accidental
 * edit to the constant (or to the example-library sync pass) is caught
 * immediately as a test failure rather than silently reaching users.
 *
 * Coverage note
 * -------------
 * The companion sync-guard test (exampleLibrarySync.test.ts) asserts that
 * `examples/timeline-overkill-theme-builder-history.mmd` stays byte-for-byte
 * in sync with the constant, so an edit to either file will surface in one of
 * these two suites.
 */

import { describe, it, expect } from "vitest";
import { EXAMPLE_CATALOG } from "@/data/example-library";

const TIMELINE_ENTRY_ID = "timeline-overkill-theme-builder-history";

describe("milestone heading content guard — timeline-overkill-theme-builder-history", () => {
  const entry = EXAMPLE_CATALOG.find((e) => e.id === TIMELINE_ENTRY_ID);

  it("catalog entry exists", () => {
    expect(entry, `EXAMPLE_CATALOG entry "${TIMELINE_ENTRY_ID}" not found`).toBeDefined();
  });

  it('section eyebrow contains "Architecture Hardening"', () => {
    expect(entry!.content).toContain("Architecture Hardening");
  });

  it('section heading contains "What shipped in v0.4 and v0.5"', () => {
    expect(entry!.content).toContain("What shipped in v0.4 and v0.5");
  });

  it('full canonical eyebrow label is "Architecture Hardening (V0.3)"', () => {
    expect(entry!.content).toContain("Architecture Hardening (V0.3)");
  });

  it('section heading contains "What shipped in v0.6"', () => {
    expect(entry!.content).toContain("What shipped in v0.6");
  });
});
