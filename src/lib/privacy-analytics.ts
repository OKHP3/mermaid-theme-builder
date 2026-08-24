export type PlausiblePageview = (eventName: "pageview", options: { url: string }) => void;

export type AnalyticsLocation = Pick<Location, "origin" | "pathname">;

/**
 * Keep analytics locations free of query strings and hash fragments.
 * Hash fragments can contain shared palette data and must never be sent.
 */
export function getPrivacySafePageUrl(location: AnalyticsLocation): string {
  return `${location.origin}${location.pathname}`;
}

export function trackInitialPageview(
  plausible: PlausiblePageview | undefined,
  location: AnalyticsLocation
): void {
  if (typeof plausible !== "function") return;

  plausible("pageview", {
    url: getPrivacySafePageUrl(location),
  });
}

export function trackBrowserPageview(): void {
  const plausible = (window as Window & { plausible?: PlausiblePageview }).plausible;
  trackInitialPageview(plausible, window.location);
}
