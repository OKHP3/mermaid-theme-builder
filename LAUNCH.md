# Hard-Launch Materials — v1.0.0

Ready-to-post copy for the v1.0.0 public launch on Hacker News, Reddit, and Product Hunt.
**Do not post until every item in the Launch Checklist below is ticked.**

---

## Launch Checklist

Complete every item before triggering any post.

- [ ] `package.json` version is `1.0.0`
- [ ] `index.html` `<meta name="description">` shows `v1.0.0`
- [ ] `scripts/check-doc-truth.mjs` exits 0 (all four truth gates pass)
- [ ] WCAG 2.1 AA accessibility audit passed (Task #601 resolved)
- [ ] All Playwright E2E tests pass in CI
- [ ] mermaid-js/mermaid community integrations PR merged or confirmed listed ([#8034](https://github.com/mermaid-js/mermaid/pull/8034))
- [ ] awesome-diagramming PR merged or confirmed listed ([demian0311/awesome-diagramming#1](https://github.com/demian0311/awesome-diagramming/pull/1))
- [ ] agenticskills.io submission completed (see `DISTRIBUTION.md`)
- [ ] agentskills.my submission completed (see `DISTRIBUTION.md`)
- [ ] overkillhill.com project page confirmed live at v1.0.0 (bump after version cut)
- [ ] Product Hunt gallery screenshots captured (see Gallery Plan section below)
- [ ] README screenshot updated to show v1.0.0 UI (Apply tab with format toggle)
- [ ] Demo GIF or short video ready (optional but significantly improves PH conversion)

---

## Hacker News — Show HN

**Title:**

```
Show HN: Mermaid Theme Builder – renderer-aware palette enforcement for Mermaid diagrams
```

**Post body:**

```
I built a browser-only governance workbench for Mermaid diagram-as-code.

The problem it solves: Mermaid's themeVariables object has 100+ keys. Different
renderers (GitHub, Obsidian, GitLab, mermaid.live, browser) support wildly different
subsets of those keys — so a theme that looks right in one place is silently broken
in another. Every team that cares about visual consistency has to rediscover this by
hand. There's no tooling that tells you which variables matter per renderer.

What the tool does:

- Palette editor with renderer profiles: you choose your target renderer, the tool
  shows which variables are relevant for it, and the export is profiled to that
  renderer. No more copy-pasting a 40-line themeVariables block that's 70% ignored.

- 31 diagram family overlays: each family (flowchart, sequence, class, ER, gitGraph,
  etc.) needs different variable subsets. The tool applies family-specific overlays
  on top of the base palette.

- 5 export formats: Mermaid init directive, JavaScript config object, YAML front
  matter, JSON, and a ChatGPT-style prompt scaffold. Each format is profiled for its
  target renderer.

- Extract tab: paste existing Mermaid code with an embedded theme and the tool
  reverse-engineers the palette variables. Useful for auditing diagrams you didn't
  write.

- SKILL.md agent skill: the governance logic ships as a 10-skill machine-readable
  family for Claude Code, Cursor, GitHub Copilot, and VS Code. The skill knows the
  renderer profiles, so an agent can pick the right export format without opening
  the browser tool.

- Shareable URL state: every palette + look + diagram selection is in the URL hash.
  Share a link and your colleague lands in the same configuration.

Technically: React 19, Vite 8, TypeScript 7.0, Mermaid 11.16.0. Browser-only — no
server, no account, no telemetry. Your diagram code stays local. UI fonts load from
Google Fonts. MIT licensed.

Live: https://okhp3.github.io/mermaid-theme-builder/
Source: https://github.com/OKHP3/mermaid-theme-builder

Happy to answer questions about the renderer compatibility model or the SKILL.md
approach. The trickiest part was figuring out which GitHub-rendered diagrams silently
ignore — it's most of the palette.
```

---

## Reddit Post

**Target subreddit:** r/mermaidjs (primary), cross-post to r/devtools or r/programming if the mods allow.

**Title:**

```
Mermaid Theme Builder v1.0.0 – renderer-aware palette enforcement, Extract tab, and AI agent skill
```

**Body:**

```
I've been working on a browser-based governance tool for Mermaid diagram theming and
it's finally at v1.0.0.

**The problem it solves**

Mermaid's themeVariables has 100+ keys. GitHub, Obsidian, GitLab, and mermaid.live
each support different subsets. There's no documented cross-reference — you have to
discover by trial and error which variables actually render on your target platform.

**What it does**

- **Renderer-aware export**: pick your target renderer (GitHub, Obsidian, GitLab,
  mermaid.live, browser Mermaid.js), get an export that's profiled for that surface.
  Currently 5 export formats: init directive, JS config object, YAML, JSON, and a
  prompt scaffold for AI tools.

- **31 diagram family overlays**: flowchart, sequence, class, state, ER, gitGraph,
  Gantt, mindmap, timeline, kanban, and more. Each family gets its own overlay on
  top of the base palette.

- **Extract tab**: paste Mermaid code that already has a theme embedded and the tool
  pulls out the palette variables. Good for auditing diagrams you inherited.

- **SKILL.md agent skill**: ships as a 10-skill machine-readable family. Drop it
  into Claude Code, Cursor, GitHub Copilot, or VS Code and your agent knows the
  renderer profiles without you explaining them.

- **7 built-in palettes** (4 utility, 3 brand), importable custom palettes, shareable
  URL state, dark/light/system mode, pan/zoom canvas, PWA installable.

**Links**

Live app: https://okhp3.github.io/mermaid-theme-builder/
GitHub: https://github.com/OKHP3/mermaid-theme-builder
Project page: https://overkillhill.com/projects/mermaid-theme-builder/

Browser-only, MIT, no login required. Happy to hear what renderer quirks you've run
into — the compatibility matrix in the Reference tab is built from real testing, not
docs.
```

---

## Product Hunt Listing

### Tagline (≤60 characters)

```
Renderer-aware palette governance for Mermaid diagrams
```

*(55 characters — fits)*

Alternative options if the above is rejected:
```
Mermaid theming that knows your renderer's limits    (52 chars)
Brand palette enforcement for Mermaid diagram-as-code (53 chars)
```

### Description (≤260 characters for the short field)

```
Browser-only governance workbench for Mermaid. Pick your renderer (GitHub, Obsidian, GitLab, mermaid.live), apply a brand palette, and export profiled code. 31 diagram families, 5 export formats, AI agent skill. MIT, no login.
```
*(228 characters)*

### Full Description (long-form listing body)

```
Mermaid Theme Builder is a browser-only visual governance workbench for Mermaid
diagram-as-code. It solves a specific problem: Mermaid's themeVariables object has
100+ keys, but different renderers support wildly different subsets. A theme that
looks polished in one place is silently broken in another.

**Core capabilities**

→ Renderer-aware export — choose your target (GitHub, Obsidian, GitLab, mermaid.live,
  or browser Mermaid.js) and get an export profiled for that surface. Five formats:
  init directive, JS config object, YAML, JSON, prompt scaffold.

→ 31 diagram family overlays — flowchart, sequence, class, state, ER, gitGraph,
  Gantt, pie, mindmap, timeline, kanban, C4, and more. Each family gets its own
  variable overlay.

→ Extract tab — paste existing Mermaid code and pull out the embedded palette
  variables. Useful for auditing diagrams you inherited or themes from other tools.

→ SKILL.md agent skill — 10-skill machine-readable family for Claude Code, Cursor,
  GitHub Copilot, and VS Code. Your agent can apply brand governance to new diagrams
  without opening the browser tool.

→ 7 built-in palettes (4 utility + 3 brand), importable custom palettes, shareable
  URL state (every palette + look is in the hash), dark/light/system mode, pan/zoom
  canvas, PWA installable.

**Technical**
React 19, Vite 8, TypeScript 7.0, Mermaid 11.16.0. Browser-only — no server, no
account, no telemetry. Your diagram code and palette stay local. MIT licensed.
```

### Maker's First Comment

```
Hey Product Hunt 👋

I'm Jamie, the builder behind Mermaid Theme Builder.

The tool started as a personal frustration: I was trying to enforce a brand palette
across Mermaid diagrams in a GitHub-hosted docs site, and I kept discovering that
half the themeVariables I set were silently ignored by GitHub's renderer. There's no
cross-reference that tells you which variables work where — so I built one, then
wrapped a UI around it.

A few things that might be interesting if you dig in:

**The renderer compatibility matrix** — the Reference tab shows, per diagram family
and per renderer, which variables actually have effect. It's built from testing, not
from reading Mermaid's source.

**The SKILL.md export** — if you use Claude Code, Cursor, or GitHub Copilot, you can
drop the skill file into your project and your agent will know the renderer profiles.
This means you can say "apply our brand palette to this diagram for GitHub" and get
correct output without specifying which variables matter.

**The Extract tab** — this one's underrated. Paste Mermaid code from anywhere and
the tool reconstructs the palette. Good for reverse-engineering someone else's theme
or auditing diagrams before a brand refresh.

I'd love to hear two things from you:
1. Which Mermaid renderers are you actually using? (GitHub, Notion, Obsidian, etc.)
2. Are there diagram families the tool handles poorly that you'd want prioritized?

Links:
• Live: https://okhp3.github.io/mermaid-theme-builder/
• Source: https://github.com/OKHP3/mermaid-theme-builder
• Docs: https://overkillhill.com/projects/mermaid-theme-builder/
```

### Gallery Plan

Capture screenshots in this order. Each should be at 1280×800 or 1440×900.

| # | Tab/State | What to show | Caption |
|---|-----------|--------------|---------|
| 1 | Apply tab | Palette picker open, a brand palette selected, code panel showing init directive for GitHub renderer | "Renderer-aware export: pick GitHub, Obsidian, or mermaid.live — get profiled code" |
| 2 | Apply tab | Export preview pane open with directive-length advisory visible | "Export preview with advisory: see exact output before you copy" |
| 3 | Compose tab | Live diagram rendering with a custom palette applied | "Live branded preview: theme a flowchart, sequence, or ER diagram in real time" |
| 4 | Extract tab | Existing Mermaid code pasted, palette variables extracted | "Extract: reverse-engineer any Mermaid theme from code you didn't write" |
| 5 | Reference tab | Capability matrix showing renderer × family × variable support | "31 diagram families × 5 renderers: see exactly which variables have effect where" |

**Video / GIF (optional but recommended)**
A 30-second screen recording showing: paste code → auto-detect family → pick renderer → toggle export format → copy. Captures the core loop and makes the value proposition immediately clear.

---

## Platform-Specific Notes

### Hacker News
- Post between 09:00–11:00 US Eastern on a weekday (Tuesday–Thursday perform best).
- Do not submit to `/newest` — submit directly to the front page with the `Show HN:` prefix.
- The first comment window matters: watch the thread for 2–3 hours after posting and reply to questions promptly. HN rewards responsiveness.
- Avoid submitting the same URL twice; if the first submission doesn't gain traction, wait 30 days before trying again.

### Reddit (r/mermaidjs)
- Check the subreddit rules before posting — some subs require flair or prohibit self-promotion without prior community contributions.
- If r/mermaidjs is too small, consider r/devtools, r/programming (self-promotion rules are strict — read them), or r/ClaudeAI / r/cursor (SKILL.md angle is relevant there).
- Post at peak sub hours; for developer subs this is typically 10:00–14:00 US Eastern.

### Product Hunt
- Schedule the launch for 12:01 AM Pacific Time on a Tuesday or Wednesday.
- Have five or more supporters ready to upvote and leave genuine comments at launch — initial velocity matters for ranking.
- Post the gallery screenshots and the maker comment within the first hour.
- Tag: `Developer Tools`, `Open Source`, `Productivity`.
- Hunter: post as yourself (OKHP3/Jamie Hill); do not use a separate hunter account.
