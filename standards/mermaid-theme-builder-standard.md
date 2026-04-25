# Mermaid Theme Builder Standard

> **Disclaimer:** Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill. It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart, Mermaid.ai, or any third-party brand represented by user-entered colors.
>
> Built-in themes are original generic palettes or personal OverKill Hill ecosystem palettes. Users are responsible for ensuring they have the right to use any brand colors, fonts, logos, or identity systems they enter into the tool.

---

## 1. Project Identity

**Name:** Mermaid Theme Builder  
**Owner:** Jamie Hill / OverKill Hill P³  
**Tool URL:** https://overkillhill.com/projects/mermaid-theme-builder/  
**Repository:** https://github.com/OKHP3/mermaid-theme-builder  

This is a personal side project. It is not affiliated with any employer, commercial product, or third-party brand.

---

## 2. Dependency Standards

### Mermaid
- Consumed as a versioned npm dependency: `mermaid ^11.x`.
- Must **not** be loaded from CDN `latest` or any unpinned runtime URL.
- Must **not** be copied or forked into the repository.
- Major version upgrades require capability registry review before merge.

### All npm Dependencies
- Managed with `pnpm`.
- Dependabot opens weekly PRs for updates.
- All dependency PRs run CI (typecheck + build) before merge.
- Human review required before merge.

---

## 3. Palette Standards

### Allowed Built-in Palettes

| Category | Palette |
|---|---|
| OKH Ecosystem | OKH Light, OKH Protocol, AskJamie Friendly, Glee-fully Bright |
| Generic Original | Neutral Enterprise, Ocean Depth, Forest Sage, Slate Ember, Violet Mist |

### OKH Ecosystem Palette Rules
- Derived from public OverKill Hill P³ site CSS (`overkillhill.com`, `askjamie.bot`, `glee-fully.tools`).
- Attribution comment must be present in the `Palette` object's `attribution` field.
- Must accurately reflect the CSS tokens documented in the public site source.

### Generic Palette Rules
- Must be fully original — not derived from any third-party brand.
- No real-company brand palettes (no Walmart, Starbucks, Apple, Microsoft, Target, Home Depot, etc.).
- Descriptive name only — no corporate brand names.

---

## 4. Capability Registry Standard

File: `artifacts/mermaid-theme-builder/src/data/mermaid-capabilities.json`

- Must be updated whenever `mermaid` is upgraded.
- `reviewedMermaidVersion` must match the installed version.
- `reviewedDate` must be updated on each review.
- All diagram types detected by `detector.ts` must be present in the registry.
- `status`, `styleSupport`, and support flags must reflect actual behavior in the reviewed version.

---

## 5. Theme Metadata Standard

Metadata comments injected into exports:

```
%% Theme: {themeName}
%% Theme ID: {themeId}
%% Created with: Mermaid Theme Builder by OverKill Hill P³ / Jamie Hill
%% Tool URL: https://overkillhill.com/projects/mermaid-theme-builder/
%% Tool Version: {toolVersion}
%% Generated: {timestamp} UTC
```

- Metadata comments use `%%` prefix (valid Mermaid comment syntax).
- Toggle defaults to **ON**.
- Toggle OFF removes all metadata from all export types.
- `toolVersion` in `themeEngine.ts` must be updated on each release.

---

## 6. Export Standards

| Export Type | Metadata | Attribution |
|---|---|---|
| Styled Code | `%%` comments (toggle) | None (code-only) |
| Markdown | `%%` comments (toggle) | HTML comment with tool attribution |
| Prompt Scaffold | HTML comment header (toggle) | Footer line with tool attribution |

---

## 7. Diagram Attribution (V0.2 — Flowchart Only, Optional)

Injecting visible attribution nodes is **not implemented in V0.2**. Reserved for V0.3+.

If implemented:
- Only for `flowchart`/`graph` diagrams.
- Default OFF.
- Must explain `securityLevel: loose` requirement if clickable attribution is used.
- Must **not** inject visible attribution into sequence, timeline, mindmap, gantt, ER, class, state, or beta diagrams.

---

## 8. Security

- This is a client-side only tool. No data is sent to any server.
- No API keys, credentials, or user data are stored or transmitted.
- No `eval` or dynamic code execution on user input.
- Mermaid rendering uses the Mermaid library's default `securityLevel` (not `loose`) unless explicitly overridden by the user in their own renderer.

---

## 9. Out of Scope

The following will **never** be added to this project:
- Backend server or API
- Login or authentication
- Payment or subscription
- Database or cloud storage
- AI API calls (LLM integration)
- File upload
- Real-company brand themes
