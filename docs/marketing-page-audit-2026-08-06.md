# overkillhill.com/projects/mermaid-theme-builder — Accuracy Audit

Checked 2026-08-06 against the app state confirmed in the prior audit (live app at v0.6.1, `package.json` at v0.6.1). Sources: live page (`overkillhill.com/projects/mermaid-theme-builder/`), raw source from GitHub (`OKHP3/OverKill-Hill:projects/mermaid-theme-builder/index.html`, 200 OK, matches the live page exactly), and the two Replit links.

## Replit links: not reachable

Both `replit.com/t/overkill-hill/repls/OverKill-Hill` and its `#projects/...` variant sit behind Replit's workspace auth — a logged-out fetch just bounces to the generic Replit sign-up page, no project content. I didn't attempt to log in (that's outside what I'll do without you present). The GitHub raw source is a reliable stand-in: it's a direct mirror of the same repo, returned real content, and matched the live site byte-for-byte on every value I checked. If you want the Replit workspace itself inspected, that needs you at the keyboard or explicit login handling on your end.

## Bottom line

The story is right. The functionality is not — or rather, it's describing a version of the app that stopped existing two releases ago. The page has its own governance built in: a header comment literally titled "SOURCE OF TRUTH" with an explicit update rule ("Update this page whenever the Notion master plan version callout or package.json versions change") and a `Last reviewed: 2026-08-03` stamp. v0.6.0 shipped the next day (2026-08-04), v0.6.1 the day after that (2026-08-05). The rule exists; it just didn't fire for the last two releases. That's the whole bug, in one sentence.

## What's accurate

- Core positioning, problem statement, and feature descriptions (theme detection, multi-format export, prompt scaffold, renderer capability notes, brand presets, pan/zoom, browser-only/no-backend/no-login) all still match what's actually built and live-verified.
- Target audience framing (enterprise architects, AI power users, doc teams, PMs, developers) matches `product-positioning.md` closely.
- Links (live tool, GitHub repo, research writeup) all resolve correctly.
- "No login. No backend. No data collection." — true today, and more true than it's ever been (GA4 was actively removed in v0.6.1).

## What's stale or wrong

| Claim on page | Page says | Actually is | Source |
|---|---|---|---|
| Version badge / "Current Release" | v0.5.0, shipped May 2026 | v0.6.1, shipped 2026-08-05 | `package.json`, live app header (`v0.6.1-e54b273`), `CHANGELOG.md` |
| Active sprint | "v0.5.x SKILL.md Hardening" | Two full releases past this (v0.6.0, v0.6.1) | `CHANGELOG.md` |
| TypeScript version | 6.0.3 | ~7.0.2 | `package.json` line 59 |
| Diagram family registry | "27+ families" (repeated 4x) | 31 tracked families (18 native, 13 partial/beta) + 10 documented gaps | live Reference tab ("31 Mermaid families · 10 gaps tracked"), `CHANGELOG.md` |
| Skill family count | "8-skill family" (repeated 6x, incl. FAQ) | 10 skills | live Reference tab ("10 skills · publicly installable"), implementation audit of `skills/` |
| Roadmap: v0.6.x | "Native Capability + Ko-fi Artifacts" | Actual v0.6.0/v0.6.1 shipped: Extract tab restore, dual-format output toggle, stroke-width control, GA4 removal, init-directive length warning. No Ko-fi artifact packaging shipped. | `CHANGELOG.md`, `roadmap.md` |
| Roadmap: v0.7.x | "Session Persistence + Multi-Diagram Canvas" | Current `roadmap.md` v0.7.0 = Governance Profiles (named/bundled theme export) | `docs/roadmap.md` |
| Roadmap: v0.8.x | "Collaboration + Governance Hardening" | Current `roadmap.md` v0.8.0 = layout-tier classDef tokens, code editor syntax highlighting, **WCAG 2.1 AA audit**, configurable Prompt Scaffold | `docs/roadmap.md` |
| Mobile hardening (FAQ, 2 mentions) | "Mobile hardening is on the v0.6.x roadmap" | Mobile/Capacitor work was explicitly named a non-goal in the two most recent PRDs (2026-08-04, 2026-08-05) and doesn't appear anywhere in current `roadmap.md` | `docs/roadmap/replit-prd-v4-v1-closure-sprint.md`, `replit-prd-v5-length-safety-and-closure.md` |
| v1.0 framing | Not mentioned as gated; page implies a clean sequential march through v0.6→v0.7→v0.8→v1.0 | v1.0.0 is explicitly gate-locked on WCAG AA audit, privacy analytics, and keyboard nav — none closed as of v0.6.1, open since v0.5.0 | `AGENTS.md` §9.9, `evidence-log-v061.md` |

Everything in that table traces to the same root cause: this page is frozen at the state of the world on or before 2026-08-03, and the roadmap section specifically is carrying forward the older `release-plan.md` ambitions (Ko-fi artifacts, session persistence, mobile hardening, collaboration features) that the project's own most recent PRDs have since moved away from in favor of the WCAG/analytics/keyboard-nav gate closure path. This is the exact contradiction flagged in the main audit — and now it's not just an internal planning-doc inconsistency, it's live in front of anyone who visits the project page.

## Minor hygiene note

The source-of-truth header comment (line 4) still reads `Notion plan: [Notion master plan — add URL]` — a placeholder never filled in. Doesn't render on the page, but it's the kind of thing that undercuts the "this file is the source of truth" claim it's sitting right above.

## Recommended fix

Run the page's own stated update rule now: sync the version badge, sprint line, and tech-stack numbers to `package.json` (v0.6.1, TypeScript ~7.0.2), update the family/skill counts (31 families, 10 skills), and rewrite the roadmap section (lines ~1080–1100) to match current `roadmap.md` — v0.7.0 Governance Profiles, v0.8.0 layout tokens + WCAG audit, v1.0.0 as the three-gate close, with the mobile/Ko-fi/collaboration language dropped or explicitly reframed as shelved. Update `Last reviewed` to today's date once done.

I don't have push access to `OKHP3/OverKill-Hill` from this session (GitHub API access isn't enabled for that repo here), so I can't commit the fix directly. If you want, I can draft the corrected copy blocks (header comment, release section, roadmap section, FAQ answers) as ready-to-paste HTML — say the word and I'll write those out.
