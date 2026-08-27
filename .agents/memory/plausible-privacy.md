---
name: Plausible privacy transport
description: Guardrails for sending privacy-safe Plausible pageviews without tracker-added URL data.
---

Use the first-party limited Plausible transport and retain its network-level E2E coverage whenever pageview measurement changes.

**Why:** Plausible's supplied manual tracker can still add `document.referrer` to an explicitly queued pageview, and standard tracking can automatically capture `location.href`. Either behavior can expose sensitive query-string or share-link content even when the application passes a sanitized page URL.

**How to apply:** The emitted request must have one explicit pageview only; a sanitized origin and pathname; no referrer or cookie header; and no user-controlled value in any payload field or header. Verify this through a browser interception test, not only a unit test of the application wrapper.