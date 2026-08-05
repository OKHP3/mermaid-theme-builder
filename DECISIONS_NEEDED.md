# DECISIONS_NEEDED

Standing record of product decisions that require explicit owner review before any code is written.
When a question is raised, open a new entry below. When resolved, mark it with the outcome and date — do not delete it.

---

## Analytics policy

**Question:** Should Mermaid Theme Builder collect any usage analytics?

**Option A — No analytics (current).** The product is browser-only and privacy-first. Users share sensitive diagram code and palette data; adding any third-party script breaks the "nothing leaves your browser" guarantee and introduces a GDPR/consent-flow obligation on a tool that deliberately has no backend.

**Option B — Opt-in, self-hosted analytics.** A privacy-respecting alternative (e.g. Plausible, self-hosted Umami) could be added behind an explicit opt-in consent banner, storing no PII and sending only aggregate page-view counts to an owner-controlled server.

**Outcome: No analytics (Option A), resolved 2026-08-05.**
Google Analytics (GA4, measurement ID G-VJ1BKXS27H) was removed. Any future proposal to add analytics must reopen this entry, describe both options, and wait for explicit owner sign-off before any tracking code is written.
