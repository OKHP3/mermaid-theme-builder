import { describe, it, expect } from "vitest";
import {
  nextSlotNumber,
  createDefaultMyThemeSlot,
  isMyThemeSlotId,
  slotDisplayName,
  MY_THEME_SLOT_IDS,
  type MyThemeSlot,
} from "@/lib/my-theme-slots";

function makeSlot(n: 1 | 2 | 3): MyThemeSlot {
  return createDefaultMyThemeSlot(n);
}

describe("nextSlotNumber", () => {
  it("returns 1 when no slots exist", () => {
    expect(nextSlotNumber([])).toBe(1);
  });

  it("returns 2 when only slot 1 exists", () => {
    expect(nextSlotNumber([makeSlot(1)])).toBe(2);
  });

  it("returns 3 when slots 1 and 2 exist", () => {
    expect(nextSlotNumber([makeSlot(1), makeSlot(2)])).toBe(3);
  });

  it("returns null when all three slots exist", () => {
    expect(nextSlotNumber([makeSlot(1), makeSlot(2), makeSlot(3)])).toBeNull();
  });

  it("returns 2 after deleting the middle slot (slots 1 and 3 remain)", () => {
    expect(nextSlotNumber([makeSlot(1), makeSlot(3)])).toBe(2);
  });

  it("returns 1 after deleting the first slot (slots 2 and 3 remain)", () => {
    expect(nextSlotNumber([makeSlot(2), makeSlot(3)])).toBe(1);
  });

  it("returns 1 after deleting slots 1 and 2 (only slot 3 remains)", () => {
    expect(nextSlotNumber([makeSlot(3)])).toBe(1);
  });

  it("returns the lowest available number, not length + 1", () => {
    // Delete slot 1, keep 2 and 3. Adding should reclaim slot 1, not slot 4.
    const result = nextSlotNumber([makeSlot(2), makeSlot(3)]);
    expect(result).toBe(1);
    expect(result).not.toBe(3);
  });

  it("produced ID from nextSlotNumber is always unique among existing IDs", () => {
    const combos: MyThemeSlot[][] = [
      [],
      [makeSlot(1)],
      [makeSlot(2)],
      [makeSlot(3)],
      [makeSlot(1), makeSlot(2)],
      [makeSlot(1), makeSlot(3)],
      [makeSlot(2), makeSlot(3)],
    ];
    for (const slots of combos) {
      const n = nextSlotNumber(slots);
      if (n === null) continue;
      const newId = `my-theme-${n}`;
      const existingIds = slots.map((s) => s.id);
      expect(existingIds).not.toContain(newId);
    }
  });
});

describe("isMyThemeSlotId", () => {
  it("accepts valid slot IDs", () => {
    for (const id of MY_THEME_SLOT_IDS) {
      expect(isMyThemeSlotId(id)).toBe(true);
    }
  });

  it("rejects invalid values", () => {
    expect(isMyThemeSlotId("my-theme-0")).toBe(false);
    expect(isMyThemeSlotId("my-theme-4")).toBe(false);
    expect(isMyThemeSlotId("")).toBe(false);
    expect(isMyThemeSlotId(null)).toBe(false);
    expect(isMyThemeSlotId(1)).toBe(false);
  });
});

describe("slotDisplayName", () => {
  it("returns display name for each slot ID", () => {
    expect(slotDisplayName("my-theme-1")).toBe("My Theme 1");
    expect(slotDisplayName("my-theme-2")).toBe("My Theme 2");
    expect(slotDisplayName("my-theme-3")).toBe("My Theme 3");
  });

  it("returns fallback for unknown IDs", () => {
    expect(slotDisplayName("unknown")).toBe("My Theme");
  });
});

describe("createDefaultMyThemeSlot", () => {
  it("creates a slot with the correct ID", () => {
    expect(createDefaultMyThemeSlot(1).id).toBe("my-theme-1");
    expect(createDefaultMyThemeSlot(2).id).toBe("my-theme-2");
    expect(createDefaultMyThemeSlot(3).id).toBe("my-theme-3");
  });

  it("uses provided source colors instead of defaults", () => {
    const colors = [{ key: "primaryColor", value: "#abcdef" }];
    const slot = createDefaultMyThemeSlot(1, colors);
    expect(slot.colors[0].value).toBe("#abcdef");
  });

  it("deep-copies source colors so mutations do not bleed", () => {
    const colors = [{ key: "primaryColor", value: "#111111" }];
    const slot = createDefaultMyThemeSlot(1, colors);
    colors[0].value = "#ffffff";
    expect(slot.colors[0].value).toBe("#111111");
  });
});
