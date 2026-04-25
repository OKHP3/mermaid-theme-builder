# Mermaid Theme Builder Standard

**Version:** 0.1  
**Owner:** OverKill Hill P³ / Jamie Hill  
**Status:** Active

This document defines the technical and design standards that all features, palettes, exports, and documentation in Mermaid Theme Builder must conform to.

---

## 1. Identity standard

### 1.1 Project identity

- This is a personal project of Jamie Hill / OverKill Hill P³
- It is not affiliated with any employer, Builders FirstSource, BFS, Mermaid, Mermaid Chart, or Mermaid.ai
- The canonical disclaimer (see AGENTS.md) must appear in README and major docs

### 1.2 Brand restrictions

The following may never appear in any file in this repository:

- Builders FirstSource, BFS, BFS Light, Builders Blue, FirstSource
- Any employer or workplace reference
- Any major retail/tech company brand theme (Walmart, Starbucks, Apple, Microsoft, Target, Home Depot, etc.)

### 1.3 Approved ecosystem

The only brand-specific palettes permitted are:
- OverKill Hill / OKHP3
- AskJamie
- Glee-fully

---

## 2. Architecture standard

### 2.1 Static-only

The app is permanently static. Adding a backend, authentication, payment, or cloud storage violates this standard and requires explicit justification and approval.

### 2.2 No Mermaid fork

Mermaid is used exclusively as an npm dependency. The source is never copied, patched, or bundled manually.

### 2.3 No runtime CDN loads for Mermaid

Mermaid is bundled at build time. Do not load it from a CDN at runtime in production.

### 2.4 Core workflow preservation

All changes must preserve the core workflow:

```
paste Mermaid → detect diagram family → select/edit theme → generate themed Mermaid → preview → copy/export
```

---

## 3. Palette standard

### 3.1 Palette schema

All palettes must conform to the `Palette` TypeScript interface in `src/lib/palettes.ts`.

Required fields:
- `id` — lowercase kebab-case slug, unique across all palettes
- `name` — human-readable display name
- `description` — one-sentence description of the palette's use case
- `colors` — array of `{ key, label, value }` objects; all keys must be valid Mermaid themeVariable names

Optional fields:
- `brandFamily` — `"okhp3"` for ecosystem palettes
- `isBrandPreset` — `true` for OKHP3 palettes
- `sourceUrls` — URLs from which color values were derived
- `themeIntent` — array of intended diagram use case strings
- `version` — semantic version string

### 3.2 Color values

- All hex values use 6-digit lowercase format: `#rrggbb`
- No hardcoded color names (e.g. `red`, `blue`) in palette color values
- OKHP3 brand palette values must be derived from publicly available CSS on GitHub
- If values are inferred or approximate, they must be labeled as `derived` in docs

### 3.3 Generic palettes

Generic utility palettes (Ocean Depth, Forest Sage, etc.) must be:
- Original — not named after real companies or brands
- Documented with a clear use case description

---

## 4. Capability registry standard

### 4.1 Registry authority

`src/data/mermaid-capabilities.ts` is the single source of truth for:
- Which diagram families exist
- How each detects its declaration keyword
- What level of theming each supports

No other file may hardcode diagram type lists or assume theming support without reading from this registry.

### 4.2 Accuracy

- `styleStrategy` values must accurately reflect what Mermaid's themeVariables actually control, tested against `MERMAID_VERSION_VERIFIED`
- Do not mark any diagram type as `"full"` unless all standard themeVariables apply reliably
- `stability` values must reflect Mermaid's own stability designation for the diagram type
- `notes` must accurately describe the specific limitations

### 4.3 Version governance

- `MERMAID_VERSION_VERIFIED` must match the Mermaid version in `package.json`
- The registry must be reviewed after every Mermaid dependency upgrade
- See `docs/MERMAID_CAPABILITY_REGISTRY.md` for the update process

---

## 5. Detection standard

### 5.1 Detection source

Diagram detection uses the `declarations` regex from the capability registry. Detection must not duplicate, diverge from, or shadow the registry.

### 5.2 Detection result

`DetectionResult` must include:
- `family` — the matched `DiagramFamily` or `"unknown"`
- `label` — human-readable display name from the capability
- `hasThemeInit` — whether the input contains an existing init block
- `warnings` — array of user-visible warning strings
- `capability` — the matched `DiagramCapability` or `null`

### 5.3 Warning standards

Warnings must be:
- Factual and specific
- Written in plain language (user-facing, non-technical)
- Not alarming for common valid inputs

---

## 6. Export standard

### 6.1 Styled Code export

Must produce:
- Valid Mermaid code that renders in any compliant Mermaid renderer
- A `%%{init: ...}%%` block using `JSON.stringify` (not string concatenation)
- Metadata comments (when enabled) using `%% ` prefix

### 6.2 Markdown Bootstrap export

Must include:
- Theme name, ID, version
- Fenced Mermaid code block
- Renderer compatibility notes
- Non-affiliation disclaimer

### 6.3 Prompt Scaffold export

Must include:
- Required `%%{init}%%` block
- Style preservation rules for the LLM
- Brand context (when using OKHP3 palettes)

### 6.4 Attribution badge

- Only injectable into flowchart diagrams
- Off by default
- Must not break Mermaid syntax
- Badge content must not impersonate any brand other than OKHP3

---

## 7. UI standard

### 7.1 Capability note

A blue `CapabilityNote` component must appear when:
- `detection.capability !== null`
- `detection.capability.styleStrategy !== "full"`
- `detection.capability.notes !== null`

It must NOT appear for flowchart diagrams or unknown input.

### 7.2 Warning banner

A yellow `WarningBanner` must appear when `detection.warnings.length > 0`.

### 7.3 Header chip

The detected diagram type label must be visible in the app header whenever a recognized diagram type is detected.

### 7.4 Export buttons

All three export buttons (Styled Code, Markdown, Prompt Scaffold) must be accessible for all detected diagram types including those with limited theming.

---

## 8. Documentation standard

### 8.1 Required docs

The following must always be current:
- `README.md`
- `AGENTS.md`
- `docs/ROADMAP.md`
- `docs/MERMAID_CAPABILITY_REGISTRY.md`
- `docs/RELEASE_CHECKLIST.md`

### 8.2 Disclaimer requirement

All major docs must include the canonical disclaimer.

### 8.3 Version references

When referencing a Mermaid version in docs, always state it as "verified against Mermaid vX.Y.Z" rather than implying it is universally current.

---

## 9. Testing standard

Before any release:

1. All 6 e2e test scenarios in `docs/RELEASE_CHECKLIST.md` must pass
2. TypeScript build must complete with zero errors
3. No console errors on fresh browser load
4. Preview renders the default flowchart example correctly

---

## 10. Versioning standard

- App version is tracked in `package.json`
- `TOOL_VERSION` in `src/lib/themeEngine.ts` must match `package.json` version
- Releases are tagged in git as `v{major}.{minor}.{patch}`
- Capability registry version is tracked via `MERMAID_VERSION_VERIFIED`
