// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ThemeLibraryStatus } from "@/components/ThemeLibraryStatus";

afterEach(cleanup);

it("queues an explicit save during draft persistence without disabling the user's intent", async () => {
  let finish!: (saved: boolean) => void;
  const onSave = vi.fn(
    () =>
      new Promise<boolean>((resolve) => {
        finish = resolve;
      })
  );
  render(
    <ThemeLibraryStatus
      name="Example"
      destination=""
      dirty
      saved
      busy
      error=""
      warnings={[]}
      recovered={false}
      onSave={onSave}
      onSaveCopy={async () => true}
      onBackup={() => {}}
      onRecovery={() => {}}
      onRestore={() => {}}
    />
  );
  const button = screen.getByRole("button", { name: "Save changes" });
  expect(button.hasAttribute("disabled")).toBe(false);
  fireEvent.click(button);
  expect(onSave).toHaveBeenCalledOnce();
  expect(button.hasAttribute("disabled")).toBe(true);
  await act(async () => finish(true));
  expect(button.hasAttribute("disabled")).toBe(false);
});
