# Render Safety Checklist — Mermaid Theme Builder

> **Disclaimer:** Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

## Purpose

This checklist defines what must be true before exporting or using themed Mermaid code from this tool to ensure safe rendering across common Mermaid renderers.

---

## 1. Init Directive Safety

- [ ] The `%%{init:...}%%` directive is on the **first non-comment line** of the diagram code.
- [ ] Theme variable values are valid CSS color strings (hex, rgb, hsl, named colors).
- [ ] No unmatched quotes inside theme variable values.
- [ ] Font family values do not contain unescaped special characters.

## 2. Diagram Type Compatibility

Check the capability registry (`src/data/mermaid-capabilities.json`) for the detected diagram type:

| Style Support Level | Expected Behavior |
|---|---|
| `high` | Full theme variables applied. classDef and linkStyle also work. |
| `medium` | Theme variables applied to primary elements. Some elements use defaults. |
| `generic-theme-only` | Only background and primary color affect rendering. |
| `unsupported` | Theme variables injected but have no visible effect. |
| `unknown` | Behavior untested. May or may not apply. |

- [ ] Diagram type is **stable** (not `beta` or `experimental`) for production use.
- [ ] If `beta`, understand the API may change in future Mermaid releases.
- [ ] If `experimental` or `unsupported`, do not rely on theme output being correct.

## 3. Clickable Nodes

Only `flowchart` / `graph` diagrams support clickable nodes.

- [ ] If using click links, set Mermaid `securityLevel: 'loose'` in the renderer config.
- [ ] Confirm the target renderer allows `securityLevel: loose` (GitHub Markdown does **not**).
- [ ] Do not add click handlers to sequence, timeline, mindmap, gantt, ER, class, or state diagrams.

## 4. Renderer Compatibility

The `%%{init:...}%%` directive is supported by:
- ✅ Mermaid.js >= 8.x in browser
- ✅ GitHub Markdown (flowchart, sequence, class, state, ER, gantt, pie, mindmap, timeline)
- ✅ GitLab Markdown
- ✅ Obsidian (with Mermaid plugin)
- ⚠️ Notion — Mermaid support is limited; theme directives may be ignored
- ⚠️ Confluence — Varies by plugin version
- ❌ Plain text / email — Mermaid does not render

## 5. Metadata Comments

Mermaid comment syntax `%%` is valid in all diagram types. Comments are safe to include.

- [ ] Metadata comments use `%%` prefix (not `//` or `#`).
- [ ] Comments appear **before** the `%%{init:...}%%` directive.

## 6. Export Format

| Export Type | Use When |
|---|---|
| Styled Code | Pasting directly into a Mermaid-aware renderer |
| Markdown | Embedding in GitHub README, docs site, or wiki |
| Prompt Scaffold | Providing theme context to an AI for further diagram generation |
