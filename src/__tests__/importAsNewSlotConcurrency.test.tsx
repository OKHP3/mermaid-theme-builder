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

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
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

describe("Import as new slot — synchronous reservation", () => {
  it("reserves distinct slots for two imports before React rerenders and shows one capacity toast", async () => {
    render(createElement(StrictMode, null, createElement(AppShell)));

    await waitFor(() =>
      expect(paletteSelectorState.props?.onImportAsNewSlot).toBeTypeOf("function")
    );
    const importAsNewSlot = paletteSelectorState.props.onImportAsNewSlot;

    await act(async () => {
      importAsNewSlot(importedPalette("First"), cleanWarnings);
      importAsNewSlot(importedPalette("Second"), cleanWarnings);
    });

    expect(paletteSelectorState.props.myThemeSlots.map((slot: { id: string }) => slot.id)).toEqual([
      "my-theme-1",
      "my-theme-2",
      "my-theme-3",
    ]);
    expect(
      new Set(paletteSelectorState.props.myThemeSlots.map((slot: { id: string }) => slot.id)).size
    ).toBe(3);

    await act(async () => {
      importAsNewSlot(importedPalette("Third"), cleanWarnings);
    });

    expect(
      screen.getAllByText("All 3 My Theme slots are in use — delete one before importing.")
    ).toHaveLength(1);
    expect(paletteSelectorState.props.myThemeSlots).toHaveLength(3);
  });
});
