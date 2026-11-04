// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { PaletteSelectorBar } from "@/components/PaletteSelectorBar";
import { createDefaultMyThemeSlot } from "@/lib/my-theme-slots";

afterEach(async () => {
  cleanup();
  // Drain scheduled radio focus before another test mounts the same tile IDs.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
});

function setup() {
  const onSelectMyThemeSlot = vi.fn();
  const onSelectPalette = vi.fn();
  const props: ComponentProps<typeof PaletteSelectorBar> = {
    allPalettes: [],
    selectedPaletteId: "",
    customColors: {},
    onSelectPalette,
    myThemeSlots: [1, 2, 3].map((index) => createDefaultMyThemeSlot(index)),
    activeMyThemeSlotId: "my-theme-2",
    onSelectMyThemeSlot,
    onAddMyThemeSlot: vi.fn(),
    onDeleteMyThemeSlot: vi.fn(),
    onExportMyThemeSlot: vi.fn(),
    onShowToast: vi.fn(),
    onDuplicateMyThemeSlot: vi.fn(),
    onRenameMyThemeSlot: vi.fn(),
    onMoveMyThemeSlotUp: vi.fn(),
    onMoveMyThemeSlotDown: vi.fn(),
    onShowProfileDetails: vi.fn(),
  };
  const view = render(<PaletteSelectorBar {...props} />);
  return { ...view, props, onSelectMyThemeSlot, onSelectPalette };
}

const navigationKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
const actions = [
  "Delete My Theme 2",
  "Move My Theme 2 up",
  "Move My Theme 2 down",
  "Duplicate My Theme 2",
  "Rename My Theme 2",
  "Profile details for My Theme 2",
  "Add My Theme workspace",
  "Import JSON as new slot",
];

describe("theme keyboard navigation ownership", () => {
  it.each(actions.flatMap((action) => navigationKeys.map((key) => ({ action, key }))))(
    "$key on $action does not select a theme or consume the key",
    ({ action, key }) => {
      const callbacks = setup();
      const button = screen.getByRole("button", { name: action });
      button.focus();
      expect(fireEvent.keyDown(button, { key })).toBe(true);
      expect(callbacks.onSelectMyThemeSlot).not.toHaveBeenCalled();
      expect(callbacks.onSelectPalette).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(button);
    }
  );

  it.each(["altKey", "ctrlKey", "metaKey", "shiftKey"])(
    "leaves %s navigation shortcuts alone",
    (modifier) => {
      const callbacks = setup();
      const radio = screen.getByRole("radio", { name: "My Theme 2 Mine" });
      for (const key of navigationKeys) {
        expect(fireEvent.keyDown(radio, { key, [modifier]: true })).toBe(true);
      }
      expect(callbacks.onSelectMyThemeSlot).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["ArrowLeft", "my-theme-1"],
    ["ArrowUp", "my-theme-1"],
    ["ArrowRight", "my-theme-3"],
    ["ArrowDown", "my-theme-3"],
    ["Home", "my-theme-1"],
    ["End", "my-theme-3"],
  ])("%s on a theme radio still selects %s", (key, id) => {
    const callbacks = setup();
    const radio = screen.getByRole("radio", { name: "My Theme 2 Mine" });
    expect(fireEvent.keyDown(radio, { key })).toBe(false);
    expect(callbacks.onSelectMyThemeSlot).toHaveBeenCalledWith(id);
  });
});

describe("theme deletion focus ownership", () => {
  function confirmDeletion() {
    const trigger = screen.getByRole("button", { name: "Delete My Theme 2" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));
    return trigger;
  }

  it("keeps focus on the trigger while removal is pending or unsuccessful", () => {
    const { props, rerender } = setup();
    const trigger = confirmDeletion();
    rerender(<PaletteSelectorBar {...props} myThemeSlots={[...props.myThemeSlots]} />);
    expect(document.activeElement).toBe(trigger);
    expect(screen.getByRole("radio", { name: "My Theme 2 Mine" })).toBeDefined();
  });

  it("restores lost focus after a delayed removal", async () => {
    const { props, rerender } = setup();
    confirmDeletion();
    rerender(
      <PaletteSelectorBar
        {...props}
        myThemeSlots={props.myThemeSlots.filter((slot) => slot.id !== "my-theme-2")}
      />
    );
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("radio", { name: "My Theme 1 Mine" }))
    );
  });

  it("does not steal focus if the user moves on before removal completes", async () => {
    const { props, rerender } = setup();
    confirmDeletion();
    const search = screen.getByRole("searchbox", { name: "Search my themes" });
    search.focus();
    rerender(
      <PaletteSelectorBar
        {...props}
        myThemeSlots={props.myThemeSlots.filter((slot) => slot.id !== "my-theme-2")}
      />
    );
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(document.activeElement).toBe(search);
  });
});
