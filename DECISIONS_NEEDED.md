# DECISIONS_NEEDED

Standing record of product decisions that require explicit owner review before any code is written.
When a question is raised, open a new entry below. When resolved, mark it with the outcome and date — do not delete it.

---

## Analytics policy

**Question:** Should Mermaid Theme Builder collect any usage analytics?

**Option A — No analytics.** The product is browser-only and privacy-first. Users share sensitive diagram code and palette data; adding any third-party script breaks the "nothing leaves your browser" guarantee and introduces a GDPR/consent-flow obligation on a tool that deliberately has no backend.

**Option B — Privacy-respecting pageview analytics.** Plausible can record aggregate pageviews without cookies. The implementation must send only a sanitized origin and pathname, never query strings, hash fragments, diagram content, palette data, or custom properties.

**Outcome: Option A, no analytics, resolved 2026-08-05.**
Google Analytics (GA4, measurement ID G-VJ1BKXS27H) was removed. On 2026-08-24, the owner reopened this entry and authorized Option B for aggregate pageviews only. The Plausible implementation uses no cookies, sends no user-entered content, and excludes query strings and hash fragments from the reported URL.
