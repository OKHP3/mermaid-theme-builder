import { useEffect } from "react";

declare function gtag(...args: unknown[]): void;

const TAB_TITLES: Record<string, string> = {
  apply: "Apply Tab",
  compose: "Compose Tab",
  examples: "Examples Tab",
  reference: "Reference Tab",
};

function resolveTitle(tab: string): string {
  return TAB_TITLES[tab] ?? "Mermaid Theme Builder";
}

/**
 * Fires a GA4 page_view event on mount and whenever the active tab changes.
 *
 * This app uses hash-based tab navigation without React Router. Tab changes
 * are driven by React state (window.location.hash is set programmatically),
 * so the hook accepts activeTab directly rather than reading hashchange events.
 *
 * send_page_view must be false in the gtag('config', ...) call in index.html
 * to prevent a duplicate pageview on initial load.
 */
export function usePageTracking(activeTab: string): void {
  useEffect(() => {
    if (typeof gtag !== "function") return;
    gtag("event", "page_view", {
      page_path: `${window.location.pathname}#${activeTab}`,
      page_title: resolveTitle(activeTab),
      page_location: window.location.href,
    });
  }, [activeTab]);
}
