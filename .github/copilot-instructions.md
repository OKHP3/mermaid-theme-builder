# GitHub Copilot Instructions — OverKill Hill P³ Monorepo

This workspace contains personal projects owned by Jamie Hill / OverKill Hill P³.
Read these instructions before generating any code, comments, or documentation.

---

## Identity and brand firewall

This is a **personal project repository**. It is not affiliated with any employer,
corporation, or third-party brand. Copilot must never generate content that references:

- Builders FirstSource, BFS, BuildersFirstSource, BFS Light, Builders Blue, FirstSource
- Any employer, daytime workplace, or work-related product of the developer
- Walmart, Target, Home Depot, Starbucks, Apple, Microsoft, Google, or any corporate brand theme
- Any large company's proprietary brand colors, named as such

If you're uncertain whether a reference is safe: omit it.

---

## Prohibited hex values

Never generate, suggest, or include any of the following hex values anywhere in this codebase.
They are associated with third-party corporate brands and are excluded on principle:

| Value | Reason |
|-------|--------|
| `#00205B` | Prohibited — third-party corporate brand |
| `#003087` | Prohibited — third-party corporate brand |
| `#002F86` | Prohibited — third-party corporate brand |
| `#B3C1DB` | Prohibited — third-party corporate brand |
| `#D6E5F9` | Prohibited — third-party corporate brand |
| `#D0D0CE` | Prohibited — third-party corporate brand |
| `#C8102E` | Prohibited — third-party corporate brand |

If you need to generate a new color, derive it from the approved palette sources below,
or use a clearly original generic color with no brand association.

---

## Approved brand properties (OKHP3 ecosystem)

Only the following brand identities and their associated color values may be used
in brand-specific palette entries:

| Brand | Domain | Use case |
|-------|--------|----------|
| OverKill Hill P³ | overkillhill.com | Technical, architectural, systems, AI tooling, strategy |
| AskJamie | askjamie.bot | Support flows, helpdesk, user-assistance, explainers |
| Glee-fully | glee-fully.tools | Personal productivity, consumer-facing, approachable diagrams |

Approved palette source: `artifacts/mermaid-theme-builder/src/lib/palettes.ts`

---

## Canonical disclaimer

All generated documentation, comments, and UI text must include this disclaimer
where relevant (README files, major docs, export footers):

> Mermaid Theme Builder is a personal OverKill Hill P³ project by Jamie Hill.
> Not affiliated with Builders FirstSource, Mermaid, Mermaid Chart, or Mermaid.ai.

---

## Architecture rules for Mermaid Theme Builder

The app at `artifacts/mermaid-theme-builder/` is permanently static and browser-only.
Never suggest adding:

- A backend server, API route, or serverless function
- User login, authentication, or session management
- AI API calls or LLM inference within the app
- Payment processing or cloud storage
- Analytics that capture or transmit pasted diagram content
- A fork or copy of Mermaid source code — always use the npm package

---

## Diagram capability rules

- `artifacts/mermaid-theme-builder/src/data/mermaid-capabilities.ts` is the single
  source of truth for diagram type detection and theme support levels
- Do not hardcode diagram type lists anywhere else
- Do not claim full theme support for diagram types where `styleStrategy !== "full"`
- New diagram types added to Mermaid must be added to the capability registry with
  accurate `styleStrategy`, `supportsClassDef`, and `stability` values

---

## Code generation style

- TypeScript first — all source files in `artifacts/mermaid-theme-builder/src/` are TypeScript
- Tailwind CSS v4 for styling — no inline styles except in generated Mermaid theme directives
- Functional React components — no class components
- No default exports from library files (`palettes.ts`, `themeEngine.ts`, `detector.ts`)
- Keep palette color values as 6-digit lowercase hex: `#rrggbb`

---

## What to do if unsure

1. Check `AGENTS.md` in the relevant artifact directory for project-specific rules
2. Check `standards/mermaid-theme-builder-standard.md` for design and architecture constraints
3. When in doubt about brand content: **omit it and leave a TODO comment**
