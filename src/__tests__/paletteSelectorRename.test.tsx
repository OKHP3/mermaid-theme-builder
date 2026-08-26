// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PaletteSelectorBar } from "@/components/PaletteSelectorBar";
import { createDefaultMyThemeSlot, type MyThemeSlot } from "@/lib/my-theme-slots";

function renderSelector(
  slots: MyThemeSlot[],
  overrides: {
    onRenameMyThemeSlot?: (id: string, newName: string) => void;
    onDuplicateMyThemeSlot?: (id: string) => string | null | void;
    onSelectMyThemeSlot?: (id: string) => void;
  } = {}
) {
  return render(
    <PaletteSelectorBar
      allPalettes={[]}
      selectedPaletteId=""
      customColors={{}}
      onSelectPalette={vi.fn()}
      myThemeSlots={slots}
      activeMyThemeSlotId={slots[0]?.id ?? null}
      onSelectMyThemeSlot={overrides.onSelectMyThemeSlot ?? vi.fn()}
      onAddMyThemeSlot={vi.fn()}
      onDeleteMyThemeSlot={vi.fn()}
      onExportMyThemeSlot={vi.fn()}
      onShowToast={vi.fn()}
      {...overrides}
    />
  );
}

afterEach(cleanup);

describe("PaletteSelectorBar — inline slot rename", () => {
  it.each(["Enter", "Tab"])("commits a changed name on %s", (key) => {
    const slot = createDefaultMyThemeSlot(1);
    const onRenameMyThemeSlot = vi.fn();
    renderSelector([slot], { onRenameMyThemeSlot });

    fireEvent.doubleClick(screen.getByText("My Theme 1"));
    const input = screen.getByRole("textbox", { name: "Rename My Theme 1" });
    fireEvent.change(input, { target: { value: "Brand Dark" } });
    fireEvent.keyDown(input, { key });
    if (key === "Tab") fireEvent.blur(input);

    expect(onRenameMyThemeSlot).toHaveBeenCalledWith("my-theme-1", "Brand Dark");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("cancels on Escape and restores the previous name", () => {
    const slot = createDefaultMyThemeSlot(1);
    const onRenameMyThemeSlot = vi.fn();
    renderSelector([slot], { onRenameMyThemeSlot });

    fireEvent.doubleClick(screen.getByText("My Theme 1"));
    const input = screen.getByRole("textbox", { name: "Rename My Theme 1" });
    fireEvent.change(input, { target: { value: "Discarded draft" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onRenameMyThemeSlot).not.toHaveBeenCalled();
    expect(screen.getByText("My Theme 1")).toBeDefined();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("offers a keyboard-focusable rename action", () => {
    const slot = createDefaultMyThemeSlot(1);
    renderSelector([slot]);

    fireEvent.click(screen.getByRole("button", { name: "Rename My Theme 1" }));

    expect(screen.getByRole("textbox", { name: "Rename My Theme 1" })).toBeDefined();
  });

  it("keeps text-navigation keys inside the rename input", () => {
    const slot = createDefaultMyThemeSlot(1);
    const onSelectMyThemeSlot = vi.fn();
    const onRenameMyThemeSlot = vi.fn();
    renderSelector([slot], { onSelectMyThemeSlot, onRenameMyThemeSlot });

    fireEvent.click(screen.getByRole("button", { name: "Rename My Theme 1" }));
    const input = screen.getByRole("textbox", { name: "Rename My Theme 1" });
    fireEvent.change(input, { target: { value: "Brand Dark" } });
    fireEvent.keyDown(input, { key: "Home" });
    fireEvent.keyDown(input, { key: "ArrowLeft" });
    fireEvent.keyDown(input, { key: "End" });

    expect(onSelectMyThemeSlot).not.toHaveBeenCalled();
    expect(onRenameMyThemeSlot).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Rename My Theme 1" })).toBeDefined();
  });

  it("focuses and selects the duplicate name for immediate typing", async () => {
    const slot = createDefaultMyThemeSlot(1);
    const copy = { ...createDefaultMyThemeSlot(2), name: "My Theme 1 (copy)" };
    const onDuplicateMyThemeSlot = vi.fn(() => "my-theme-2");
    const selectSpy = vi.spyOn(HTMLInputElement.prototype, "select");
    const props = { onDuplicateMyThemeSlot };
    const view = renderSelector([slot], props);

    fireEvent.click(screen.getByRole("button", { name: "Duplicate My Theme 1" }));
    view.rerender(
      <PaletteSelectorBar
        allPalettes={[]}
        selectedPaletteId=""
        customColors={{}}
        onSelectPalette={vi.fn()}
        myThemeSlots={[slot, copy]}
        activeMyThemeSlotId="my-theme-2"
        onSelectMyThemeSlot={vi.fn()}
        onAddMyThemeSlot={vi.fn()}
        onDeleteMyThemeSlot={vi.fn()}
        onExportMyThemeSlot={vi.fn()}
        onShowToast={vi.fn()}
        onDuplicateMyThemeSlot={onDuplicateMyThemeSlot}
      />
    );

    const input = (await screen.findByRole("textbox", {
      name: "Rename My Theme 1 (copy)",
    })) as HTMLInputElement;
    expect(input.value).toBe("My Theme 1 (copy)");
    expect(selectSpy).toHaveBeenCalled();
  });
});
