# Promotion Strategy — Mermaid Theme Builder

**Last updated:** 2026-08-06
**Derived from:** `docs/market-research.md` (2026-05-21), `docs/product-positioning.md` (2026-06-20), CHANGELOG.md v0.6.1 gate status, and a live competitive/growth-tactics refresh run 2026-08-06.
**Status:** Internal reference — decision memo, not yet executed.

---

## Executive Summary

- `docs/market-research.md` and `docs/product-positioning.md` already cover the competitive landscape thoroughly (three-model research pass). This document does not repeat that work — it refreshes the one item that could have gone stale and adds a promotion plan on top.
- The kill condition flagged in market-research.md ("Mermaid Chart ships portable theme export + AI prompt scaffold within 2 quarters") has **not** triggered as of 2026-08-06. Mermaid Chart's Theme Selector, now under the mermaid.ai domain, is still a six-item preset dropdown (Mermaid Chart / Default / Forest / Base / Dark / Neutral) — no per-family editing, no portable export, no prompt scaffold. The defensible wedge described in market-research.md is still open.
- The bigger open question is timing, not competition. Per CHANGELOG.md, v0.6.1 has closed the analytics gate (GA4 removed) but the WCAG 2.1 AA accessibility audit is still an open v1.0.0 gate.
- GitHub star-growth research is consistent: a concentrated multi-channel launch (Hacker News + Reddit + Product Hunt, same day) converts far better than a scattered drip, and that tactic is effectively single-use — spend it once, at the right moment.
- LinkedIn's 2026 algorithm rewards weekly-cadence native content (roughly a 2x engagement lift vs. bursty posting) and penalizes promo-flavored bursts, outbound-link-heavy posts, and engagement bait. Comment depth and saves outrank raw likes.
- An underused channel: agent-skill ecosystems (Claude/Cursor/Copilot skill directories, awesome-claude-code, awesome-cursorrules). The project already ships a packaged skill (`skills/okhp3-mermaid-theme-builder/`) — this is a low-friction distribution surface separate from GitHub stars or LinkedIn.
- Naming risk from market-research.md (confusion with Mermaid Chart's own "Theme Selector") is unresolved and matters more once external traffic starts arriving than it does today as a quiet repo.

---

## Competitive Refresh (2026-08-06)

| Item | May 2026 finding | August 2026 status |
|---|---|---|
| Mermaid Chart Theme Selector | Dropdown only, no per-diagram editing, no export | Unchanged — still a 6-preset dropdown at mermaid.ai/docs/guides/theme-selector, no portable export, no AI scaffold |
| Kill condition #1 (Mermaid Chart ships the wedge) | Probability: medium within 12 months | Not triggered; wedge remains open |
| beautiful-mermaid | Tracked as a free/OSS competitor (color-picker UI, no multi-family, no renderer warnings) | Still tracked, no material change found |
| New entrant: pretty-mermaid-skills | Not in original research | Surfaced in this pass (blog coverage, March 2026) — an AI-dev-focused Mermaid skill. Source page was robots-blocked during this review; feature scope unverified. Flag for a follow-up look before any public launch copy is finalized. |

**Conclusion:** no update needed to the Verdict in market-research.md. Proceed on the existing positioning.

---

## Promotion Options

| Option | What it is | Tradeoff |
|---|---|---|
| **A — Staged (recommended)** | Soft-launch now via awesome-lists + skill-ecosystem placement + build-in-public LinkedIn content. Hold the HN/Reddit/Product Hunt blitz for the v1.0.0 tag once the WCAG audit closes. | Slower initial spike, but the one-shot blitz lever isn't spent on a product with an open accessibility gate. |
| **B — Blitz now at v0.6.1** | Full concentrated launch today. | Momentum now, but launching an enterprise-architect-facing governance tool with an unaudited accessibility gate invites exactly the kind of scrutiny this audience is positioned to give. |
| **C — Niche-only** | Distribute purely through skill marketplaces and awesome-lists; let Claude/Cursor/Copilot users discover it organically. | Lowest effort, avoids the naming-confusion risk entirely, but caps upside — doesn't meaningfully move GitHub stars or LinkedIn reach. |
| **D — Full delay** | Resolve WCAG and the naming question first, then launch everything at once. | Cleanest launch, but the market window (confirmed still open today) sits unused for however long the audit/rename takes. |

**Recommendation: Option A.**

Run the zero-cost, passive items now (awesome-mermaid submission, skill-directory listings) — they compound regardless of timing. Run LinkedIn as build-in-public content through the existing `okhp3-linkedin-angles` → `okhp3-linkedin-post` → `okhp3-linkedin-voice` pipeline, not as launch content, so it doesn't read as a campaign to the current network. Hold the HN/Reddit/Product Hunt blitz until v1.0.0 ships.

---

## Risks + Mitigations

| Risk | Mitigation |
|---|---|
| Naming collision with Mermaid Chart's "Theme Selector" surfaces right when search traffic starts arriving | Tighten the tagline before wide launch copy goes out; resolve the rename question from market-research.md (e.g. "Theme Forge for Mermaid") ahead of the blitz, not after |
| LinkedIn activity reads as promotional/bot-like to the existing network | Weekly-max cadence; vary content type (problem post, build-in-public post, launch post, retro post — not four launch-flavored posts in a row); reply to comments personally, since dwell time and comment depth are the ranking signals that matter, not post count |
| BFS/employer conflation | Existing personal-account framing and non-affiliation disclaimer already cover this; hold the line once posts start getting traction |
| First-party (Mermaid Chart, $7.5M funded) catches up | Get the renderer parity matrix and prompt-scaffold export publicly dated and citable before the blitz, so there's prior art on record regardless of what ships later |
| Spending the concentrated-launch lever too early | Hold it for the v1.0.0 tag per Option A — it's a single-use tactic per the growth research reviewed |

---

## Next Actions

- [ ] Close the WCAG 2.1 AA audit gate (only open item blocking v1.0.0 per CHANGELOG.md)
- [ ] Submit to awesome-mermaid and adjacent awesome-lists (no timing cost)
- [ ] Submit the skill package to Claude/Cursor/Copilot skill directories (awesome-claude-code, awesome-cursorrules)
- [ ] Run `okhp3-linkedin-angles` against `docs/market-research.md`, `docs/product-positioning.md`, and CHANGELOG.md to mine build-in-public angles (not launch angles)
- [ ] Seed 100–300 stars from personal network before any public blitz (conversion roughly doubles above the 1,000-star mark per the growth research reviewed; social proof needs to exist before that)
- [ ] Resolve the naming/trademark question from market-research.md before finalizing public launch copy
- [ ] Decide and commit to an issue-response SLA before driving real traffic

---

## Sources Consulted (2026-08-06 refresh)

- [Theme Selector feature — Mermaid Chart](https://mermaid.ai/docs/guides/theme-selector)
- [How to Get GitHub Stars for Open Source Projects in 2026 — 33K Stars Case Study](https://gingiris.github.io/growth-tools/blog/2026/03/25/how-to-get-more-github-stars-the-definitive-guide-33k-stars-case-study/)
- [How the LinkedIn Algorithm Works in 2026 (Hootsuite)](https://blog.hootsuite.com/linkedin-algorithm/)
- [Pretty-mermaid-skills: The Essential Diagram Tool for AI Developers](https://blog.brightcoding.dev/2026/03/04/pretty-mermaid-skills-the-essential-diagram-tool-for-ai-developers) — title/context only, source page was robots-blocked during fetch
