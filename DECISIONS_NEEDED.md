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

### Verification record — 2026-09-01

- **Implementation and privacy boundary:** Pass. `src/lib/privacy-analytics.ts`, `public/plausible-privacy.js`, and the browser interception coverage send exactly one `pageview` with the `okhp3.github.io` domain and the origin plus pathname only. The payload has no custom event, properties, Mermaid content, palette data, query string, or hash fragment; the request omits referrer and cookies.
- **Live GitHub Pages smoke check:** Pass. A browser visit to `https://okhp3.github.io/mermaid-theme-builder/?private-query=diagram-secret#shared-palette-payload` emitted one intercepted request with `u` equal to `https://okhp3.github.io/mermaid-theme-builder/`; no sensitive URL value was present.
- **Plausible dashboard confirmation:** Pending owner verification outside this repository. The Plausible dashboard must show the site `okhp3.github.io` as active, record the production path `/mermaid-theme-builder/`, and omit the query string and shared-palette hash from its report. No dashboard credentials or synthetic production visit are used here.
