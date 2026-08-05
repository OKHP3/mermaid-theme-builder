/**
 * Unit tests for the pure slot lifecycle operations:
 *   duplicateSlot, moveSlotUp, moveSlotDown
 *
 * These are the canonical tests for task #612 (Governance Profile lifecycle UI).
 * They exercise the logic in isolation from React state, so the test surface
 * is easy to reason about and does not require jsdom or a rendered component.
 */

import { describe, it, expect } from "vitest";
import {
  createDefaultMyThemeSlot,
  duplicateSlot,
  moveSlotUp,
  moveSlotDown,
  type MyThemeSlot,
} from "@/lib/my-theme-slots";

function makeSlot(n: 1 | 2 | 3): MyThemeSlot {
  return createDefaultMyThemeSlot(n);
}

// ── duplicateSlot ─────────────────────────────────────────────────────────────

describe("duplicateSlot", () => {
  it("returns null when all 3 slots are in use", () => {
    const slots = [makeSlot(1), makeSlot(2), makeSlot(3)];
    expect(duplicateSlot(slots, "my-theme-1")).toBeNull();
  });

  it("returns null when source id is not found", () => {
    const slots = [makeSlot(1)];
    // @ts-expect-error intentionally passing an unknown id for the test
    expect(duplicateSlot(slots, "my-theme-99")).toBeNull();
  });

  it("creates a copy with the next available slot id", () => {
    const slots = [makeSlot(1)];
    const result = duplicateSlot(slots, "my-theme-1");
    expect(result).not.toBeNull();
    expect(result!.newSlotId).toBe("my-theme-2");
    expect(result!.slots).toHaveLength(2);
  });

  it("appends (copy) to the name", () => {
    const slots = [makeSlot(1)];
    const result = duplicateSlot(slots, "my-theme-1")!;
    const copy = result.slots.find((s) => s.id === result.newSlotId);
    expect(copy?.name).toBe("My Theme 1 (copy)");
  });

  it("appends (copy) to a custom name", () => {
    const source: MyThemeSlot = { ...makeSlot(2), name: "Brand Dark" };
    const result = duplicateSlot([source], "my-theme-2")!;
    const copy = result.slots.find((s) => s.id === result.newSlotId);
    expect(copy?.name).toBe("Brand Dark (copy)");
  });

  it("does not mutate the source slot name", () => {
    const source = makeSlot(1);
    const originalName = source.name;
    duplicateSlot([source], "my-theme-1");
    expect(source.name).toBe(originalName);
  });

  it("does not mutate the source slot colors array", () => {
    const source = makeSlot(1);
    const originalLength = source.colors.length;
    duplicateSlot([source], "my-theme-1");
    expect(source.colors).toHaveLength(originalLength);
  });

  it("deep-copies colors — mutation of source does not affect copy", () => {
    const source = makeSlot(1);
    const result = duplicateSlot([source], "my-theme-1")!;
    const copy = result.slots.find((s) => s.id === result.newSlotId)!;
    // Mutate source first color after duplication
    if (source.colors.length > 0) {
      source.colors[0] = { ...source.colors[0], value: "#deadbeef" };
    }
    if (copy.colors.length > 0) {
      expect(copy.colors[0].value).not.toBe("#deadbeef");
    }
  });

  it("deep-copies typography — mutation of source does not affect copy", () => {
    const source = makeSlot(1);
    const result = duplicateSlot([source], "my-theme-1")!;
    const copy = result.slots.find((s) => s.id === result.newSlotId)!;
    source.typography.nodeLabel.fontSize = 999;
    expect(copy.typography.nodeLabel.fontSize).not.toBe(999);
  });

  it("preserves look from source", () => {
    const source: MyThemeSlot = { ...makeSlot(1), look: "neo" };
    const result = duplicateSlot([source], "my-theme-1")!;
    const copy = result.slots.find((s) => s.id === result.newSlotId)!;
    expect(copy.look).toBe("neo");
  });

  it("preserves fontSize from source", () => {
    const source: MyThemeSlot = { ...makeSlot(1), fontSize: "18px" };
    const result = duplicateSlot([source], "my-theme-1")!;
    const copy = result.slots.find((s) => s.id === result.newSlotId)!;
    expect(copy.fontSize).toBe("18px");
  });

  it("uses the lowest available slot number (not length + 1)", () => {
    // slots 1 and 3 exist; next should be 2, not 4
    const slots = [makeSlot(1), makeSlot(3)];
    const result = duplicateSlot(slots, "my-theme-1")!;
    expect(result.newSlotId).toBe("my-theme-2");
  });

  it("the new slot id does not collide with any existing slot id", () => {
    const slots = [makeSlot(1), makeSlot(2)];
    const result = duplicateSlot(slots, "my-theme-1")!;
    const existingIds = slots.map((s) => s.id);
    expect(existingIds).not.toContain(result.newSlotId);
  });

  it("the returned slots array is a new reference (immutable style)", () => {
    const slots = [makeSlot(1)];
    const result = duplicateSlot(slots, "my-theme-1")!;
    expect(result.slots).not.toBe(slots);
  });

  it("source slot is still present in the returned slots array", () => {
    const slots = [makeSlot(1)];
    const result = duplicateSlot(slots, "my-theme-1")!;
    expect(result.slots.some((s) => s.id === "my-theme-1")).toBe(true);
  });
});

// ── moveSlotUp ────────────────────────────────────────────────────────────────

describe("moveSlotUp", () => {
  it("moves the target slot one position toward the start", () => {
    const slots = [makeSlot(1), makeSlot(2)];
    const moved = moveSlotUp(slots, "my-theme-2");
    expect(moved[0].id).toBe("my-theme-2");
    expect(moved[1].id).toBe("my-theme-1");
  });

  it("is a no-op when the slot is already first", () => {
    const slots = [makeSlot(1), makeSlot(2)];
    const moved = moveSlotUp(slots, "my-theme-1");
    expect(moved[0].id).toBe("my-theme-1");
    expect(moved[1].id).toBe("my-theme-2");
  });

  it("is a no-op when the id is not found", () => {
    const slots = [makeSlot(1), makeSlot(2)];
    const moved = moveSlotUp(slots, "my-theme-3");
    expect(moved[0].id).toBe("my-theme-1");
    expect(moved[1].id).toBe("my-theme-2");
  });

  it("returns a new array — does not mutate the original", () => {
    const slots = [makeSlot(1), makeSlot(2)];
    const moved = moveSlotUp(slots, "my-theme-2");
    expect(moved).not.toBe(slots);
    // Original order must be unchanged
    expect(slots[0].id).toBe("my-theme-1");
    expect(slots[1].id).toBe("my-theme-2");
  });

  it("preserves all slots — count does not change", () => {
    const slots = [makeSlot(1), makeSlot(2), makeSlot(3)];
    expect(moveSlotUp(slots, "my-theme-3")).toHaveLength(3);
  });

  it("works with three slots — moves the middle slot to the front", () => {
    const slots = [makeSlot(1), makeSlot(2), makeSlot(3)];
    const moved = moveSlotUp(slots, "my-theme-2");
    expect(moved[0].id).toBe("my-theme-2");
    expect(moved[1].id).toBe("my-theme-1");
    expect(moved[2].id).toBe("my-theme-3");
  });

  it("works with three slots — moves the last slot to the middle", () => {
    const slots = [makeSlot(1), makeSlot(2), makeSlot(3)];
    const moved = moveSlotUp(slots, "my-theme-3");
    expect(moved[0].id).toBe("my-theme-1");
    expect(moved[1].id).toBe("my-theme-3");
    expect(moved[2].id).toBe("my-theme-2");
  });

  it("boundary: single slot list is a no-op", () => {
    const slots = [makeSlot(1)];
    const moved = moveSlotUp(slots, "my-theme-1");
    expect(moved[0].id).toBe("my-theme-1");
  });
});

// ── moveSlotDown ──────────────────────────────────────────────────────────────

describe("moveSlotDown", () => {
  it("moves the target slot one position toward the end", () => {
    const slots = [makeSlot(1), makeSlot(2)];
    const moved = moveSlotDown(slots, "my-theme-1");
    expect(moved[0].id).toBe("my-theme-2");
    expect(moved[1].id).toBe("my-theme-1");
  });

  it("is a no-op when the slot is already last", () => {
    const slots = [makeSlot(1), makeSlot(2)];
    const moved = moveSlotDown(slots, "my-theme-2");
    expect(moved[0].id).toBe("my-theme-1");
    expect(moved[1].id).toBe("my-theme-2");
  });

  it("is a no-op when the id is not found", () => {
    const slots = [makeSlot(1), makeSlot(2)];
    const moved = moveSlotDown(slots, "my-theme-3");
    expect(moved[0].id).toBe("my-theme-1");
    expect(moved[1].id).toBe("my-theme-2");
  });

  it("returns a new array — does not mutate the original", () => {
    const slots = [makeSlot(1), makeSlot(2)];
    const moved = moveSlotDown(slots, "my-theme-1");
    expect(moved).not.toBe(slots);
    expect(slots[0].id).toBe("my-theme-1");
    expect(slots[1].id).toBe("my-theme-2");
  });

  it("preserves all slots — count does not change", () => {
    const slots = [makeSlot(1), makeSlot(2), makeSlot(3)];
    expect(moveSlotDown(slots, "my-theme-1")).toHaveLength(3);
  });

  it("works with three slots — moves the middle slot to the end", () => {
    const slots = [makeSlot(1), makeSlot(2), makeSlot(3)];
    const moved = moveSlotDown(slots, "my-theme-2");
    expect(moved[0].id).toBe("my-theme-1");
    expect(moved[1].id).toBe("my-theme-3");
    expect(moved[2].id).toBe("my-theme-2");
  });

  it("works with three slots — moves the first slot to the middle", () => {
    const slots = [makeSlot(1), makeSlot(2), makeSlot(3)];
    const moved = moveSlotDown(slots, "my-theme-1");
    expect(moved[0].id).toBe("my-theme-2");
    expect(moved[1].id).toBe("my-theme-1");
    expect(moved[2].id).toBe("my-theme-3");
  });

  it("boundary: single slot list is a no-op", () => {
    const slots = [makeSlot(1)];
    const moved = moveSlotDown(slots, "my-theme-1");
    expect(moved[0].id).toBe("my-theme-1");
  });
});

// ── Cross-operation consistency ───────────────────────────────────────────────

describe("moveSlotUp / moveSlotDown round-trip", () => {
  it("moving up then down returns to original order", () => {
    const slots = [makeSlot(1), makeSlot(2), makeSlot(3)];
    const after = moveSlotDown(moveSlotUp(slots, "my-theme-2"), "my-theme-2");
    expect(after[0].id).toBe("my-theme-1");
    expect(after[1].id).toBe("my-theme-2");
    expect(after[2].id).toBe("my-theme-3");
  });

  it("moving down then up returns to original order", () => {
    const slots = [makeSlot(1), makeSlot(2), makeSlot(3)];
    const after = moveSlotUp(moveSlotDown(slots, "my-theme-2"), "my-theme-2");
    expect(after[0].id).toBe("my-theme-1");
    expect(after[1].id).toBe("my-theme-2");
    expect(after[2].id).toBe("my-theme-3");
  });
});
