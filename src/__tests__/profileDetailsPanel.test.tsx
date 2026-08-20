// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createDefaultMyThemeSlot } from "@/lib/my-theme-slots";
import { migrateSlotToProfile, profileToPortableJson } from "@/lib/governance-profile";
import {
  ProfileDetailsPanel,
  type ProfileDetailsPanelProps,
} from "@/components/ProfileDetailsPanel";

const SLOT_ID = "my-theme-1";
const SLOT_NAME = "My Theme 1";

function makeProps(overrides: Partial<ProfileDetailsPanelProps> = {}): ProfileDetailsPanelProps {
  const slot = createDefaultMyThemeSlot(1);
  return {
    open: true,
    onClose: vi.fn(),
    slot,
    rendererTarget: "",
    outputFormat: "init-directive",
    slotsFull: false,
    onRename: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onShowToast: vi.fn(),
    ...overrides,
  };
}

function closeAfterAnimation(onClose: ProfileDetailsPanelProps["onClose"]) {
  act(() => {
    vi.advanceTimersByTime(150);
  });
  expect(onClose).toHaveBeenCalledTimes(1);
}

function startNameEdit() {
  fireEvent.click(screen.getByRole("button", { name: `Edit profile name: ${SLOT_NAME}` }));
  return screen.getByRole("textbox", { name: "Edit profile name" });
}

function openDeleteConfirmation() {
  fireEvent.click(screen.getByRole("button", { name: `Delete profile "${SLOT_NAME}"` }));
  expect(screen.getByText(`Delete “${SLOT_NAME}”?`)).toBeDefined();
}

async function importFile(json: string) {
  const input = screen.getByLabelText("Import governance profile JSON");
  const file = new File([json], "profile.json", { type: "application/json" });

  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
    await Promise.resolve();
    await Promise.resolve();
  });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ProfileDetailsPanel — inline name editing", () => {
  it("commits a changed name on Enter", () => {
    const props = makeProps();
    render(<ProfileDetailsPanel {...props} />);

    const input = startNameEdit();
    fireEvent.change(input, { target: { value: "Brand Contract" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(props.onRename).toHaveBeenCalledWith(SLOT_ID, "Brand Contract");
    expect(screen.queryByRole("textbox", { name: "Edit profile name" })).toBeNull();
  });

  it("commits a changed name on blur", () => {
    const props = makeProps();
    render(<ProfileDetailsPanel {...props} />);

    const input = startNameEdit();
    fireEvent.change(input, { target: { value: "Blurred Contract" } });
    fireEvent.blur(input);

    expect(props.onRename).toHaveBeenCalledWith(SLOT_ID, "Blurred Contract");
    expect(screen.queryByRole("textbox", { name: "Edit profile name" })).toBeNull();
  });

  it("cancels editing on Escape and restores the original name", () => {
    const props = makeProps();
    render(<ProfileDetailsPanel {...props} />);

    const input = startNameEdit();
    fireEvent.change(input, { target: { value: "Uncommitted Draft" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(props.onRename).not.toHaveBeenCalled();
    expect(screen.getByText(SLOT_NAME)).toBeDefined();
    expect(screen.queryByRole("textbox", { name: "Edit profile name" })).toBeNull();
  });

  it("does not call onRename when editing is committed without a change", () => {
    const props = makeProps();
    render(<ProfileDetailsPanel {...props} />);

    const input = startNameEdit();
    fireEvent.keyDown(input, { key: "Enter" });

    expect(props.onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Edit profile name" })).toBeNull();
  });
});

describe("ProfileDetailsPanel — delete confirmation", () => {
  it("shows confirmation first, then returns to actions when cancelled", () => {
    const props = makeProps();
    render(<ProfileDetailsPanel {...props} />);

    openDeleteConfirmation();
    expect(screen.getByRole("button", { name: "Delete permanently" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("button", { name: "Delete permanently" })).toBeNull();
    expect(screen.getByRole("button", { name: `Delete profile "${SLOT_NAME}"` })).toBeDefined();
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it("calls onDelete and closes after permanent deletion", () => {
    vi.useFakeTimers();
    const props = makeProps();
    render(<ProfileDetailsPanel {...props} />);

    openDeleteConfirmation();
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

    expect(props.onDelete).toHaveBeenCalledWith(SLOT_ID);
    closeAfterAnimation(props.onClose);
  });
});

describe("ProfileDetailsPanel — duplicate and import actions", () => {
  it("disables Duplicate when all slots are occupied", () => {
    const props = makeProps({ slotsFull: true });
    render(<ProfileDetailsPanel {...props} />);

    const duplicate = screen.getByRole("button", { name: `Duplicate profile "${SLOT_NAME}"` });
    expect(duplicate.hasAttribute("disabled")).toBe(true);
  });

  it("imports valid JSON, passes the profile through, and closes", async () => {
    vi.useFakeTimers();
    const props = makeProps();
    const profile = migrateSlotToProfile(props.slot!);
    render(<ProfileDetailsPanel {...props} />);

    await importFile(profileToPortableJson(profile));

    expect(props.onImport).toHaveBeenCalledTimes(1);
    expect(props.onImport).toHaveBeenCalledWith(expect.objectContaining({ name: SLOT_NAME }), []);
    closeAfterAnimation(props.onClose);
  });

  it("shows an error toast for invalid JSON without closing", async () => {
    vi.useFakeTimers();
    const props = makeProps();
    render(<ProfileDetailsPanel {...props} />);

    await importFile("{ definitely not valid profile json");

    expect(props.onImport).not.toHaveBeenCalled();
    expect(props.onShowToast).toHaveBeenCalledWith(
      expect.stringContaining("Profile import failed")
    );
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeDefined();
  });
});

describe("ProfileDetailsPanel — Escape state transitions", () => {
  it("backs out of name editing before closing the panel", () => {
    vi.useFakeTimers();
    const props = makeProps();
    render(<ProfileDetailsPanel {...props} />);

    startNameEdit();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Edit profile name" })).toBeNull();

    fireEvent.keyDown(window, { key: "Escape" });
    closeAfterAnimation(props.onClose);
  });

  it("backs out of delete confirmation before closing the panel", () => {
    vi.useFakeTimers();
    const props = makeProps();
    render(<ProfileDetailsPanel {...props} />);

    openDeleteConfirmation();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Delete permanently" })).toBeNull();

    fireEvent.keyDown(window, { key: "Escape" });
    closeAfterAnimation(props.onClose);
  });

  it("closes immediately when no sub-state is active", () => {
    vi.useFakeTimers();
    const props = makeProps();
    render(<ProfileDetailsPanel {...props} />);

    fireEvent.keyDown(window, { key: "Escape" });

    closeAfterAnimation(props.onClose);
  });
});
