// @vitest-environment happy-dom

/**
 * Unit tests for the RouteSelector first-use entry screen (Task #629).
 */

import { vi, describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { RouteSelector } from "@/components/RouteSelector";
import type { AppTab } from "@/App";

afterEach(() => {
  cleanup();
});

/** Return only the four route-card buttons using the data attribute. */
function getCards(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("[data-route-card]"));
}

describe("RouteSelector", () => {
  it("renders all four route cards", () => {
    render(<RouteSelector onSelect={vi.fn()} />);
    const cards = getCards();
    expect(cards).toHaveLength(4);
    const labels = cards.map((c) => c.getAttribute("aria-label") ?? "");
    expect(labels.some((l) => l.includes("Apply a Theme"))).toBe(true);
    expect(labels.some((l) => l.includes("Create a Theme"))).toBe(true);
    expect(labels.some((l) => l.includes("Explore Examples"))).toBe(true);
    expect(labels.some((l) => l.includes("Extract from a Diagram"))).toBe(true);
  });

  it("calls onSelect with 'apply' when the Apply card is clicked", () => {
    const onSelect = vi.fn();
    render(<RouteSelector onSelect={onSelect} />);
    const applyCard = getCards().find((c) =>
      (c.getAttribute("aria-label") ?? "").includes("Apply a Theme")
    );
    expect(applyCard).not.toBeNull();
    fireEvent.click(applyCard!);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith("apply" satisfies AppTab);
  });

  it("calls onSelect with 'compose' when the Create card is clicked", () => {
    const onSelect = vi.fn();
    render(<RouteSelector onSelect={onSelect} />);
    const card = getCards().find((c) =>
      (c.getAttribute("aria-label") ?? "").includes("Create a Theme")
    );
    expect(card).not.toBeNull();
    fireEvent.click(card!);
    expect(onSelect).toHaveBeenCalledWith("compose" satisfies AppTab);
  });

  it("calls onSelect with 'examples' when the Explore card is clicked", () => {
    const onSelect = vi.fn();
    render(<RouteSelector onSelect={onSelect} />);
    const card = getCards().find((c) =>
      (c.getAttribute("aria-label") ?? "").includes("Explore Examples")
    );
    expect(card).not.toBeNull();
    fireEvent.click(card!);
    expect(onSelect).toHaveBeenCalledWith("examples" satisfies AppTab);
  });

  it("calls onSelect with 'extract' when the Extract card is clicked", () => {
    const onSelect = vi.fn();
    render(<RouteSelector onSelect={onSelect} />);
    const card = getCards().find((c) =>
      (c.getAttribute("aria-label") ?? "").includes("Extract from a Diagram")
    );
    expect(card).not.toBeNull();
    fireEvent.click(card!);
    expect(onSelect).toHaveBeenCalledWith("extract" satisfies AppTab);
  });

  it("renders a Skip button that calls onSelect with 'apply'", () => {
    const onSelect = vi.fn();
    render(<RouteSelector onSelect={onSelect} />);
    const skipBtn = screen.getByRole("button", { name: /Skip/i });
    expect(skipBtn).not.toBeNull();
    fireEvent.click(skipBtn);
    expect(onSelect).toHaveBeenCalledWith("apply" satisfies AppTab);
  });

  it("renders a heading with 'What would you like to do?'", () => {
    render(<RouteSelector onSelect={vi.fn()} />);
    const heading = screen.getByRole("heading");
    expect(heading.textContent).toContain("What would you like to do?");
  });

  describe("keyboard navigation", () => {
    it("moves focus to the next card with ArrowRight", () => {
      render(<RouteSelector onSelect={vi.fn()} />);
      const cards = getCards();
      const grid = cards[0].parentElement!;
      cards[0].focus();
      fireEvent.keyDown(grid, { key: "ArrowRight" });
      expect(document.activeElement).toBe(cards[1]);
    });

    it("wraps focus from last card to first with ArrowRight", () => {
      render(<RouteSelector onSelect={vi.fn()} />);
      const cards = getCards();
      const grid = cards[0].parentElement!;
      cards[cards.length - 1].focus();
      fireEvent.keyDown(grid, { key: "ArrowRight" });
      expect(document.activeElement).toBe(cards[0]);
    });

    it("moves focus to the previous card with ArrowLeft", () => {
      render(<RouteSelector onSelect={vi.fn()} />);
      const cards = getCards();
      const grid = cards[0].parentElement!;
      cards[1].focus();
      fireEvent.keyDown(grid, { key: "ArrowLeft" });
      expect(document.activeElement).toBe(cards[0]);
    });

    it("moves focus forward with ArrowDown", () => {
      render(<RouteSelector onSelect={vi.fn()} />);
      const cards = getCards();
      const grid = cards[0].parentElement!;
      cards[0].focus();
      fireEvent.keyDown(grid, { key: "ArrowDown" });
      expect(document.activeElement).toBe(cards[1]);
    });

    it("moves focus backward with ArrowUp", () => {
      render(<RouteSelector onSelect={vi.fn()} />);
      const cards = getCards();
      const grid = cards[0].parentElement!;
      cards[2].focus();
      fireEvent.keyDown(grid, { key: "ArrowUp" });
      expect(document.activeElement).toBe(cards[1]);
    });
  });
});
