/**
 * RouteSelector — first-use entry screen shown to new users who have no
 * persisted state.
 *
 * Presents four option cards (Apply, Create, Explore, Extract) so the user
 * can orient themselves and pick a starting point.  The choice is persisted
 * as `activeTab` + `firstVisitComplete: true` by the App-level handler.
 *
 * Keyboard:
 *  - Tab / Shift+Tab cycle through all interactive elements.
 *  - ArrowRight / ArrowDown move focus to the next card (wrapping).
 *  - ArrowLeft / ArrowUp move focus to the previous card (wrapping).
 *  - Enter / Space activate the focused card.
 *  - "Skip" button is a keyboard-focusable link at the bottom.
 */

import { useRef, useEffect, useCallback } from "react";
import type { AppTab } from "@/App";

interface RouteSelectorProps {
  /** Called when the user picks a route or hits "Skip". */
  onSelect: (tab: AppTab) => void;
}

interface RouteOption {
  tab: AppTab;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ROUTE_OPTIONS: RouteOption[] = [
  {
    tab: "apply",
    title: "Apply a Theme",
    description: "Pick a palette and export themed code for your Mermaid diagrams",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6" aria-hidden="true">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
  },
  {
    tab: "compose",
    title: "Create a Theme",
    description: "Build a custom palette from scratch and export or share it",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    tab: "examples",
    title: "Explore Examples",
    description: "Browse themed diagrams across every Mermaid diagram family",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    tab: "extract",
    title: "Extract from a Diagram",
    description: "Pull colors out of an existing themed Mermaid diagram",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 2a.75.75 0 01.75.75v8.614l3.205-3.129a.75.75 0 111.09 1.03l-4.25 4.5a.75.75 0 01-1.09 0l-4.25-4.5a.75.75 0 111.09-1.03L9.25 11.364V2.75A.75.75 0 0110 2z"
          clipRule="evenodd"
        />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
      </svg>
    ),
  },
];

export function RouteSelector({ onSelect }: RouteSelectorProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLButtonElement>(null);

  // Focus the first card on mount so keyboard users can navigate immediately.
  useEffect(() => {
    firstCardRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const cards = gridRef.current?.querySelectorAll<HTMLButtonElement>("[data-route-card]");
    if (!cards || cards.length === 0) return;
    const focused = document.activeElement;
    const idx = Array.from(cards).findIndex((c) => c === focused);
    if (idx === -1) return;

    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next = (idx + 1) % cards.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      next = (idx - 1 + cards.length) % cards.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      next = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      next = cards.length - 1;
    }
    if (next !== idx) cards[next]?.focus();
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-full px-4 py-10 md:py-16 bg-background"
      role="region"
      aria-label="Choose where to start"
    >
      {/* Heading */}
      <div className="text-center mb-10 max-w-sm">
        <p className="forge-eyebrow text-primary/70 mb-2 tracking-widest text-[10px] uppercase">
          Welcome
        </p>
        <h1 className="text-xl font-semibold text-foreground mb-2 leading-snug">
          What would you like to do?
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Pick a starting point — you can always switch tabs later.
        </p>
      </div>

      {/* Option grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg"
        onKeyDown={handleKeyDown}
        role="group"
        aria-label="Starting point options"
      >
        {ROUTE_OPTIONS.map((opt, i) => (
          <button
            key={opt.tab}
            ref={i === 0 ? firstCardRef : undefined}
            data-route-card
            data-tab={opt.tab}
            type="button"
            onClick={() => onSelect(opt.tab)}
            className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-card/50 hover:bg-card hover:border-primary/40 p-4 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/60"
            aria-label={`${opt.title} — ${opt.description}`}
          >
            <div className="text-primary/70 group-hover:text-primary group-focus-visible:text-primary transition-colors">
              {opt.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-snug mb-0.5">
                {opt.title}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={() => onSelect("apply")}
        className="mt-8 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors focus:outline-none focus-visible:underline"
        aria-label="Skip the welcome screen and go straight to Apply"
      >
        Skip — go straight to Apply →
      </button>
    </div>
  );
}
