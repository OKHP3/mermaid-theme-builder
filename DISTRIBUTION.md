# Distribution Log

Tracks every submission of Mermaid Theme Builder to external directories, awesome-lists, and skill registries.
Update this file whenever a new submission is made or a status changes.

---

## Submitted

### mermaid-js/mermaid — Community Integrations

| Field | Value |
|-------|-------|
| **Directory** | [Mermaid Community Integrations](https://mermaid.js.org/ecosystem/integrations-community.html) |
| **Target file** | `docs/ecosystem/integrations-community.md` in [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) |
| **PR** | [#8034](https://github.com/mermaid-js/mermaid/pull/8034) |
| **Submitted** | 2026-08-06 |
| **Status** | ⏳ Pending review — checked 2026-08-27; PR remains open and unmerged |
| **Entry added** | `### Other` section, alphabetically after `mermaid-server` |
| **Entry text** | `- [Mermaid Theme Builder: Visual governance workbench for Mermaid — brand palette enforcement, renderer-aware export, and SKILL.md agent skill for Claude Code, Cursor, and GitHub Copilot](https://github.com/OKHP3/mermaid-theme-builder)` |

---

### demian0311/awesome-diagramming

| Field | Value |
|-------|-------|
| **Directory** | [Awesome Diagramming](https://github.com/demian0311/awesome-diagramming) |
| **PR** | [#1](https://github.com/demian0311/awesome-diagramming/pull/1) |
| **Submitted** | 2026-08-06 |
| **Status** | ❌ Rejected — 2026-08-09; PR closed without merge (no maintainer change request recorded) |
| **Entry added** | `### General Purpose` section, immediately after the Mermaid entry |
| **Entry text** | `* [Mermaid Theme Builder](https://github.com/OKHP3/mermaid-theme-builder) (Free, Open Source, Mermaid governance layer, Ease of use - Easy, Visual Appearance - Modern). Brand palette enforcement, renderer-aware export (5 formats), 31 diagram families, SKILL.md agent skill. Live - [Link](https://okhp3.github.io/mermaid-theme-builder/)` |

---

### AgenticSkills

| Field | Value |
|-------|-------|
| **Directory** | [AgenticSkills](https://agenticskills.io/) |
| **Submission endpoint** | [Submit a Skill](https://agenticskills.io/submit) |
| **Review confirmation** | [Review issue URL returned by AgenticSkills](https://github.com/Korona7x17/agenticskills/issues/92) |
| **Submitted** | 2026-09-03 |
| **Status** | ⏳ Pending review — endpoint returned HTTP 200 with `ok: true` and a review issue URL. The returned GitHub repository currently responds 404 when checked publicly on 2026-09-03, so no public listing is claimed yet. |

---

## Pending Manual Submission

The remaining directory below has no server-backed submission path. Its metadata is pre-filled for a future operator-supported intake.

### Verification note — 2026-09-03

The [AgenticSkills](https://agenticskills.io/) submission is recorded above. The [agentskills.my form](https://agentskills.my/submit) still only logs the form payload in the browser and displays a local success message; it makes no network request and provides no review or confirmation record.

---

### agentskills.my

**Submit at:** https://agentskills.my/submit
**Status — 2026-09-03:** Not submitted. The live page's handler only logs the form payload in the browser and shows a local success message; it makes no network request and provides no review or confirmation record.

| Field | Value |
|-------|-------|
| GitHub Repository URL | https://github.com/OKHP3/mermaid-theme-builder |
| Skill Name | okhp3-mermaid-theme-builder |
| Short Description | Visual governance workbench for Mermaid diagram-as-code with brand palette enforcement, renderer-aware export, and a 10-skill SKILL.md agent family. |
| Category | 💻 Coding |
| Compatible Platforms | 🤖 Claude Code, 🐙 GitHub Copilot, ⚡ Cursor, 🌊 Windsurf |
| GitHub Username | OKHP3 |

---

## Not Submitted / Out of Scope

| Directory | Reason |
|-----------|--------|
| tinh2/skills-hub-registry | Internal production registry with strict CI validation scripts; requires local environment to run `./scripts/validate-skills.sh`. Suitable for a separate, carefully validated PR. |
| Hacker News / Reddit / Product Hunt | Reserved for hard-launch (separate task). |
| mermaid.js.org Discord #showcase | Manual Discord post — no API. Share the live app URL with a screenshot when ready for visibility in the Mermaid community. |

---

## Entry Metadata (canonical, use for all future submissions)

```
Name:         Mermaid Theme Builder
Version:      v0.6.1
GitHub:       https://github.com/OKHP3/mermaid-theme-builder
Live app:     https://okhp3.github.io/mermaid-theme-builder/
Project page: https://overkillhill.com/projects/mermaid-theme-builder/
License:      MIT
Language:     TypeScript 7.0
Mermaid:      11.16.0

Short (≤200 chars):
  Brand palette enforcement and renderer-aware export for Mermaid diagram-as-code.
  31 diagram families, 5 export formats, 10-skill SKILL.md agent family.

One-line:
  Visual governance workbench for Mermaid diagram-as-code — brand palette enforcement,
  renderer-aware export, and SKILL.md agent skill for Claude Code, Cursor, and GitHub Copilot.

Tags: mermaid, diagram, theming, governance, skill, claude-code, cursor, github-copilot,
      typescript, browser-only, open-source, MIT
```
