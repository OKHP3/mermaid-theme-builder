// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const paletteSelectorState = vi.hoisted(() => ({
  props: null as any,
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg><g></g></svg>", bindFunctions: undefined }),
  },
}));

vi.mock("@/components/PaletteSelectorBar", () => ({
  PaletteSelectorBar: (props: any) => {
    paletteSelectorState.props = props;
    return null;
  },
}));

import { act, cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { createElement, StrictMode } from "react";
import { AppShell } from "@/App";
import { BRAND_PALETTES, type Palette } from "@/lib/palettes";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("mtb.firstVisit", "true");
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  paletteSelectorState.props = null;
});

const cleanWarnings = { invalidValues: [], warnValues: [] };

function importedPalette(name: string): Palette {
  return {
    ...BRAND_PALETTES[0],
    id: `import-${name.toLowerCase()}`,
    name,
  };
}

describe("Reviewed imports preserve concurrent candidates", () => {
  it("retains two pending imports and assigns distinct IDs only after confirmation", async () => {
    render(createElement(StrictMode, null, createElement(AppShell)));

    await waitFor(() =>
      expect(paletteSelectorState.props?.onImportAsNewSlot).toBeTypeOf("function")
    );
    const importAsNewSlot = paletteSelectorState.props.onImportAsNewSlot;

    await act(async () => {
      importAsNewSlot(importedPalette("First"), cleanWarnings);
      importAsNewSlot(importedPalette("Second"), cleanWarnings);
    });

    expect(paletteSelectorState.props.myThemeSlots).toHaveLength(0);
    expect(screen.getByRole("dialog", { name: "Review theme import" }).textContent).toContain(
      "2 themes"
    );
    fireEvent.click(screen.getByRole("button", { name: "Import as copies" }));
    await waitFor(() => expect(paletteSelectorState.props.myThemeSlots).toHaveLength(2));
    expect(
      new Set(paletteSelectorState.props.myThemeSlots.map((slot: { id: string }) => slot.id)).size
    ).toBe(2);

    await act(async () => {
      importAsNewSlot(importedPalette("Third"), cleanWarnings);
      importAsNewSlot(importedPalette("First"), cleanWarnings);
    });

    fireEvent.click(screen.getByRole("button", { name: "Import as copies" }));
    await waitFor(() => expect(paletteSelectorState.props.myThemeSlots).toHaveLength(4));
    expect(
      new Set(paletteSelectorState.props.myThemeSlots.map((slot: { id: string }) => slot.id)).size
    ).toBe(4);
  });
});
