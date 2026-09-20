import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Calendar } from "../components/ui/calendar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../components/ui/resizable";
afterEach(cleanup);
it("keeps the calendar grid styled and supports next-month navigation", () => {
  render(<Calendar defaultMonth={new Date(2026, 8, 1)} />);
  expect(screen.getByRole("grid").className).toContain("border-collapse");
  fireEvent.click(screen.getByRole("button", { name: /next month/i }));
  expect(screen.getByRole("grid").getAttribute("aria-label")).toContain("October");
});
it.each(["horizontal", "vertical"] as const)(
  "renders keyboard-accessible %s panels",
  (orientation) => {
    render(
      <ResizablePanelGroup orientation={orientation}>
        <ResizablePanel id="left" defaultSize="50%">
          Left
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="right">Right</ResizablePanel>
      </ResizablePanelGroup>
    );
    const separator = screen.getByRole("separator");
    expect(separator.getAttribute("aria-orientation")).toBe(
      orientation === "horizontal" ? "vertical" : "horizontal"
    );
    expect(separator.getAttribute("tabindex")).toBe("0");
  }
);
