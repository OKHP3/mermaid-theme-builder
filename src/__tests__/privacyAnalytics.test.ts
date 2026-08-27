import { describe, expect, it, vi } from "vitest";
import {
  getPrivacySafePageUrl,
  trackInitialPageview,
  type PlausiblePageview,
} from "@/lib/privacy-analytics";

describe("privacy-safe analytics", () => {
  it("removes query strings and hash fragments from pageview locations", () => {
    const location = new URL(
      "https://okhp3.github.io/mermaid-theme-builder/?source=secret#share-palette-payload"
    );

    expect(getPrivacySafePageUrl(location)).toBe("https://okhp3.github.io/mermaid-theme-builder/");
  });

  it("sends only a pageview with the sanitized page URL", () => {
    const plausible = vi.fn<PlausiblePageview>();

    trackInitialPageview(plausible, {
      origin: "https://okhp3.github.io",
      pathname: "/mermaid-theme-builder/",
    });

    expect(plausible).toHaveBeenCalledOnce();
    expect(plausible).toHaveBeenCalledWith("pageview", {
      url: "https://okhp3.github.io/mermaid-theme-builder/",
    });
  });

  it("does nothing when the provider is unavailable", () => {
    expect(() =>
      trackInitialPageview(undefined, {
        origin: "https://okhp3.github.io",
        pathname: "/mermaid-theme-builder/",
      })
    ).not.toThrow();
  });
});
