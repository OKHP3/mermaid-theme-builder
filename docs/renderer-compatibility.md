# Renderer Compatibility Reference

**Last updated:** 2026-06-20
**Mermaid version verified against:** 11.16.0
**Sources:** Claude market research, Perplexity competitive analysis (2026-05-21); Microsoft Loop community reports (2026-06-20)

This document records how different Mermaid rendering environments handle the theming features that Mermaid Theme Builder exports. It is the foundation for the renderer-specific warnings shown in the Apply tab.

---

## Theming Mechanism Support by Renderer

| Renderer | `%%{init}%%` directives | `themeVariables` | `classDef` | CSS `<style>` injection | Custom fonts |
|---|---|---|---|---|---|
| **Mermaid Live Editor** | Full | Full | Full | Full | Partial |
| **Mermaid Chart (SaaS)** | Full | Full | Full | Full | Partial |
| **GitHub** (native `.md`) | Partial | Partial | Yes | **Blocked** | No |
| **GitLab** (native `.md`) | Partial | Partial | Yes | Partial | No |
| **Microsoft Loop / M365 Copilot** | Partial | Partial | Partial | No | No |
| **Obsidian** | Full | Full | Full | Partial | Yes (via plugin) |
| **Notion** (Mermaid Chart plugin) | Limited | Limited | No | No | No |
| **Confluence** (Mermaid Chart plugin) | Partial | Partial | Partial | No | No |
| **Docusaurus** (`@docusaurus/theme-mermaid`) | Full | Full | Full | Partial | Partial |
| **Hugo** (theme-relearn, theme-stack) | Full | Full | Full | Partial | Partial |
| **VS Code** (bierner extension) | Full | Full | Full | Partial | No |
| **Lucidchart** | Embed-in-code only | Embed-in-code only | Embed-in-code only | No | No |

### Microsoft Loop / M365 Copilot Notes

- Prefer `%%{init}%%` directive format over YAML frontmatter — Loop may not process frontmatter reliably in all versions.
- Use `look: classic` — Neo and Hand-Drawn are not reliably supported.
- Custom `fontFamily` is ignored — the platform applies its own font stack (Segoe UI / Calibri / Arial).
- Avoid beta and experimental diagram families — rendering support varies by internal Mermaid version.
- Mermaid version may lag behind the current release; behavior may differ from Mermaid Live Editor output.

### Security Restrictions Causing Failures

- **GitHub and GitLab block CSS injection** via `<style>` tags — XSS risk. Use `classDef` instead.
- **Custom fonts blocked by CSP** on most hosted platforms. `fontFamily` themeVariable will silently fall back to the platform's default font.
- **Some platforms strip `%%{init}%%` directives** — Notion in particular applies its own Mermaid configuration.
- **GitHub cannot change `fontFamily`** — documented by Gordonby in the community theming reference.
- **Microsoft Loop custom fonts are ignored** — Segoe UI / Calibri / Arial are the platform default stack.

---

## Diagram-Family Support by Theming Mechanism

| Diagram Type | Built-in themes | `themeVariables` | `classDef` | `linkStyle` | CSS injection |
|---|---|---|---|---|---|
| Flowchart | Full | Full | Yes | Yes | Partial |
| Sequence | Partial | Limited | **No** | **No** | Partial |
| Class | Full | Full | Yes | Yes | Partial |
| State | Full | Full | Yes | Yes | Partial |
| ER | Partial | Limited | **No** | **No** | Partial |
| Gantt | Generic | Minimal | **No** | **No** | Partial |
| Timeline | Generic | Minimal | **No** | **No** | Partial |
| Mindmap | Generic | Minimal | **No** | **No** | Partial |
| Pie | Generic | Minimal | **No** | **No** | Partial |
| Git Graph | Generic | Minimal | **No** | **No** | Partial |
| User Journey | Generic | Minimal | **No** | **No** | Partial |
| XY Chart | Generic | Minimal | **No** | **No** | Partial |
| Sankey (beta) | Unknown | Unknown | Unknown | Unknown | Unknown |
| Architecture (beta) | Partial | Partial | **No** | **No** | Partial |
| Wardley (beta) | Limited | Background only | **No** | **No** | Partial |
| TreeView (beta) | Limited | Limited | **No** | **No** | Partial |
| Event Modeling (11.15, experimental) | Limited | Limited | **No** | **No** | Partial |
| C4 | **Ignores themeVariables** | Ignored | **No** | **No** | Partial |
| Quadrant (beta) | Unknown | Unknown | Unknown | Unknown | Unknown |

---

## `look:` Mode Support by Diagram Family

The `look` config key (`neo`, `handDrawn`, `classic`) rolls out family-by-family and is **not uniformly supported**.

| Diagram Type | `classic` | `neo` | `handDrawn` | Notes |
|---|---|---|---|---|
| Flowchart | Yes | Yes | Yes | Full support |
| State | Yes | Yes | Yes | Full support (added in 11.14) |
| Sequence | Yes | Yes | Partial | Neo added in 11.14 |
| Class | Yes | Partial | Partial | Neo partial |
| ER | Yes | Partial | No | handDrawn unsupported |
| Architecture (beta) | Yes | Partial | No | randomize config added in 11.14 |
| Wardley (beta) | Yes | No | No | handDrawn explicitly unsupported |
| TreeView (beta) | Yes | No | No | Experimental, minimal look support |
| Mindmap | Yes | No | No | Generic only |
| Gantt | Yes | No | No | Generic only |
| C4 | Yes | No | No | Theming largely ignored |

**Key implication for the app:** The `look` setting in the `%%{init}%%` directive should surface per-family warnings. Exporting `look: handDrawn` for a Wardley map should generate a warning.

---

## Practical Warning Strings

These are the renderer-specific warnings that the app should display when a conflict is detected:

```
Warning: CSS injection is blocked on GitHub and GitLab — use classDef instead.
Warning: Custom fonts will not render on GitHub, GitLab, Confluence, or M365 Loop — fontFamily will be ignored.
Warning: Notion has limited init directive support — themeVariables may not apply.
Warning: Microsoft Loop may not process YAML frontmatter — use %%{init}%% directive format instead.
Warning: classDef is not supported in sequence diagrams — node-level styles will be ignored.
Warning: handDrawn look is not supported for Wardley maps — it will fall back to classic.
Warning: C4 diagrams largely ignore themeVariables — only background colors apply.
Warning: This diagram type (Event Modeling) is new in Mermaid 11.15.0 and may not render in older installations.
```

---

## Known Bugs in Specific Renderers

| Issue | Renderer | Mermaid GitHub ref |
|---|---|---|
| Mindmap dark mode broken | GitHub native | Community discussion #189152 |
| Sequence diagram foreignObject bugs | Hugo themes | mermaid #611 |
| Per-variant theme switching unsupported | Hugo themes | mermaid #219 |
| fontFamily ignored in GitHub native | GitHub | Gordonby reference |

---

## Research Data Quality Notes

- GitHub and GitLab renderer behavior is well-documented across primary sources (confirmed).
- Obsidian behavior documented via forum threads — may vary by plugin version.
- Notion support reported as "limited" based on community evidence; Mermaid Chart plugin behavior may differ from native Notion Mermaid embedding.
- Lucidchart behavior reported as "pinned versions with embed-in-code theming only" — not exhaustively verified.
- Microsoft Loop / M365 Copilot support based on community reports (June 2026) — behavior may vary by Loop version and tenant configuration.
- `look:` mode support per-family is based on Mermaid 11.14–11.15 release notes; older versions may differ.
