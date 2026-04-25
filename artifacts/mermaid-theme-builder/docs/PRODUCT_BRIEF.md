# Product Brief — Mermaid Theme Builder v0.1

**Project:** Mermaid Theme Builder  
**Owner:** Jamie Hill / OverKill Hill P³  
**Status:** Public alpha  
**Last updated:** 2026-04-25

---

## What it is

Mermaid Theme Builder is a fully static, browser-only visual governance utility for Mermaid diagrams. It helps you define a visual theme once, apply it to existing Mermaid code, preview the result, and export the themed diagram or a reusable prompt scaffold — so your LLM-generated diagrams stay on-brand.

Nothing is sent to a server. Your diagram code never leaves your browser.

---

## The problem it solves

AI assistants (ChatGPT, Claude, Gemini, Cursor, etc.) generate Mermaid diagrams constantly. They generate valid diagrams but almost never with correct, consistent styling. The `%%{init}%%` theme directive is underused, rarely documented, and frequently hallucinated.

Mermaid Theme Builder gives you:

1. A reusable theme expressed as a `%%{init}%%` block
2. A way to apply that theme to any Mermaid diagram in one click
3. A "Prompt Scaffold" export that teaches your AI assistant to maintain the theme in future diagrams

---

## Core workflow

```
paste Mermaid → detect diagram family → select/edit theme → themed preview → export
```

1. **Paste** — drop in any Mermaid diagram
2. **Detect** — the app identifies the diagram type and shows theme support level
3. **Theme** — select a brand preset or edit colors manually
4. **Preview** — compare Original and Themed side by side
5. **Export** — copy Styled Code, Markdown Bootstrap, or Prompt Scaffold

---

## Non-goals (V1)

- No backend
- No login or user accounts
- No AI API calls
- No payment or cloud storage
- No file upload
- No fork of Mermaid
- No analytics that capture diagram content

---

## Built-in themes

### Brand presets (OKHP3 ecosystem)

| Palette | Site | Use case |
|---|---|---|
| OverKill Hill P³ | overkillhill.com | Technical, architectural, systems, executive-facing |
| AskJamie | askjamie.bot | Support flows, helpdesk, user-assistance |
| Glee-fully | glee-fully.tools | Personal productivity, consumer-facing, approachable |

### Utility palettes

- Ocean Depth — corporate blue
- Forest Sage — nature/sustainability
- Slate Ember — dark industrial
- Violet Mist — soft creative

---

## Diagram support

The app includes a capability registry covering 25 Mermaid diagram types. Not all support the same level of theming:

| Strategy | Meaning |
|---|---|
| **Full** | All themeVariables apply reliably |
| **Partial** | Most apply; some colors are managed internally |
| **Limited** | Background/text apply; diagram-specific colors do not |

When a diagram type has limited or partial support, a blue info note appears below the input area.

---

## Attribution model

- Metadata comments are included by default in all exports
- An optional attribution badge node can be injected into flowchart diagrams only
- All exports include a non-affiliation disclaimer

---

## Canonical disclaimer

> Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.

---

## Success criteria for V0.1

- [ ] Full BFS/employer brand firewall in place
- [ ] Three OKHP3 brand presets with accurate colors
- [ ] 25-type capability registry
- [ ] Capability note shown for non-full diagram types
- [ ] Three export formats working with metadata
- [ ] Live side-by-side preview
- [ ] Fully static — no network calls except Mermaid dependency load at build time
- [ ] Attribution badge injectable for flowchart only

---

## Roadmap summary

See [ROADMAP.md](ROADMAP.md) for the full roadmap.

**V0.2 targets:**
- LocalStorage palette persistence
- Diagram type selector with example library
- Compatibility reference table for all 25 diagram types

**V0.3 targets:**
- Public alpha announcement
- GitHub release with signed tag
- OKHP3 website integration
