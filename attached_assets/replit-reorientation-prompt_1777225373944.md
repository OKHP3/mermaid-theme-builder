# REPLIT SESSION CONTEXT — Mermaid Theme Builder Reorientation

## IDENTITY

This project (Mermaid Theme Builder) is a personal OverKill Hill P3 project by Jamie Hill. It is NOT associated with any employer, including Builders FirstSource (BFS). Do NOT use BFS hex values (#00205B, #003087, #002F86, #B3C1DB, #D6E5F9, #D0D0CE, #C8102E) or reference BFS in any preset, label, comment, or documentation.

---

## TASK 1: REPLACE PALETTE PRESETS WITH BRAND-ALIGNED PRESETS

The current four generic presets (Ocean Depth, Forest Sage, Slate Ember, Violet Mist) should be KEPT but SUPPLEMENTED with three brand-aligned presets derived from Jamie's personal web properties. Add these three palettes to `artifacts/mermaid-theme-builder/src/lib/palettes.ts` using the same `Palette` interface:

### Preset: OverKill Hill P3

- **id**: `overkill-hill`
- **name**: `OverKill Hill P3`
- **description**: `Industrial dark mode with teal and amber forge accents — bold, high-contrast, built for architecture diagrams`
- **Colors**:
  - primaryColor: `#1C3A34` (deep teal)
  - primaryTextColor: `#F6F2EE` (paper cream)
  - primaryBorderColor: `#E6A03C` (amber forge)
  - lineColor: `#2D6F7E` (teal accent)
  - secondaryColor: `#2D6F7E` (teal accent)
  - tertiaryColor: `#F6F2EE` (paper cream)
  - background: `#111827` (dark surface)
  - mainBkg: `#1C3A34` (deep teal)
  - nodeBorder: `#E6A03C` (amber forge)
  - clusterBkg: `#161b22` (panel dark)
  - titleColor: `#E6A03C` (amber forge)
  - edgeLabelBackground: `#111827` (dark surface)
  - fontFamily: `Impact, Inter, system-ui, sans-serif`

### Preset: Glee-fully

- **id**: `glee-fully`
- **name**: `Glee-fully`
- **description**: `Warm and playful with coral and cream — approachable, energetic, great for how-to flows and tutorials`
- **Colors**:
  - primaryColor: `#D94F63` (coral)
  - primaryTextColor: `#FFFFFF` (white)
  - primaryBorderColor: `#B03A4D` (deep coral)
  - lineColor: `#2D6F7E` (teal accent)
  - secondaryColor: `#2D6F7E` (teal)
  - tertiaryColor: `#F6F2EE` (paper cream)
  - background: `#F6F2EE` (paper cream)
  - mainBkg: `#FDEAED` (light coral wash)
  - nodeBorder: `#D94F63` (coral)
  - clusterBkg: `#FFF5F0` (warm white)
  - titleColor: `#D94F63` (coral)
  - edgeLabelBackground: `#F6F2EE` (paper cream)
  - fontFamily: `Trebuchet MS, Calibri, sans-serif`

### Preset: AskJamie

- **id**: `askjamie`
- **name**: `AskJamie`
- **description**: `Calm mid-century tones with muted aquas and beige — clean, readable, ideal for guides and documentation`
- **Colors**:
  - primaryColor: `#2D6F7E` (teal)
  - primaryTextColor: `#FFFFFF` (white)
  - primaryBorderColor: `#1C5361` (deep teal)
  - lineColor: `#4A9BAD` (aqua)
  - secondaryColor: `#8FBFC9` (light aqua)
  - tertiaryColor: `#F6F2EE` (paper cream)
  - background: `#F6F2EE` (paper cream)
  - mainBkg: `#E0EEEF` (pale aqua)
  - nodeBorder: `#2D6F7E` (teal)
  - clusterBkg: `#EDE9E3` (warm beige)
  - titleColor: `#1C5361` (deep teal)
  - edgeLabelBackground: `#F6F2EE` (paper cream)
  - fontFamily: `Georgia, Calibri, serif`

### Implementation Notes
- Add these three presets AFTER the existing four generic presets in the `BUILTIN_PALETTES` array
- Do not remove the existing Ocean Depth, Forest Sage, Slate Ember, Violet Mist presets — they serve as neutral options for users without a brand
- The palette selector UI in `ThemeBuilder.tsx` should accommodate 7 presets (currently a 2-column grid, may need to become a 3-column or scrollable list)

---

## TASK 2: MERMAID.JS VERSION STRATEGY

### Current state
The `package.json` pins `"mermaid": "^11.14.0"` which is correct. The `^` semver range means it will accept minor and patch updates automatically on `pnpm install`.

### Diagram type discovery
Mermaid.js does NOT expose a runtime API that lists all supported diagram types programmatically. The supported types are baked into the parser. The detector in `src/lib/detector.ts` currently handles 15 types via regex patterns. When Mermaid adds new diagram types (rare — maybe 1-2 per year), the detector regex list must be updated manually. This is acceptable.

### Action items
1. Add a comment at the top of `detector.ts`: `// Diagram patterns aligned to mermaid v11.14.0 — update when new types ship`
2. Keep the `^` semver range — do NOT pin to an exact version. Mermaid patch/minor releases fix rendering bugs and should be picked up automatically.
3. Do NOT attempt to dynamically discover diagram types from the mermaid module at runtime — it's not exposed and would require parsing internal AST registrations.

---

## TASK 3: THEME METADATA WATERMARK FEATURE

### Concept
When a user applies a theme (built-in or custom), the tool should optionally inject a small metadata annotation into the diagram output. This serves as a discreet attribution/advertisement for Mermaid Theme Builder.

### Mermaid supports this
Mermaid flowcharts support a `click` directive that makes any node a hyperlink. The implementation:

1. Add a small linked node at the bottom of the diagram output
2. The node contains: theme name, tool name, optional version
3. The node links back to the tool URL (e.g., `https://overkillhill.com/projects/mermaid-theme-builder/`)
4. Style it with a dedicated `classDef watermark` that makes it small and unobtrusive

### Generated output example
When enabled, the theme engine should append something like:

```
    MTB_WATERMARK(["Styled with OverKill Hill P3 — Mermaid Theme Builder"])
    classDef watermark fill:none,stroke:#888,stroke-width:1px,color:#888,font-size:10px
    class MTB_WATERMARK watermark
    click MTB_WATERMARK "https://overkillhill.com/projects/mermaid-theme-builder/" _blank
```

### UI controls needed
Add to `ThemeBuilder.tsx`:
- A toggle switch: **"Include theme attribution"** — default: ON
- A text input: **"Theme name"** — pre-filled with the selected preset name, editable for custom themes
- When the toggle is ON, `generateThemedCode()` in `themeEngine.ts` appends the watermark node to the output
- When the toggle is OFF, no watermark is added

### Theme metadata object
When a user creates a custom theme (edits any color from a preset), the tool should track:
- `themeName`: user-editable string (defaults to preset name or "Custom")
- `basePreset`: which preset it was derived from
- `createdAt`: ISO timestamp when the customization started
- `updatedAt`: ISO timestamp of the last color change

This metadata should be included in the Prompt Scaffold export and the Markdown Bootstrap export, but NOT injected into the diagram code itself (only the watermark node goes into the diagram).

---

## TASK 4: ADD SHOWCASE DIAGRAM AS DEFAULT SAMPLE

Replace the current `SAMPLE_CODE` constant in `ThemeBuilder.tsx` with the OverKill Hill Content Machine diagram. This diagram demonstrates 7 subgraphs, 33 nodes, 8+ shape types, 3 hyperlinked brand nodes, 6 classDef classes, multiple direction changes, and feedback loops. It is the definitive showcase of what the tool can do.

The new `SAMPLE_CODE` should be:

```typescript
const SAMPLE_CODE = `flowchart TB
    SPARK(("Idea Spark"))

    subgraph IGNITION["STAGE 1: IGNITION CHAMBER"]
        direction LR
        I1(["Raw Thought"])
        I2[("Thought Buffer")]
        I3{"Viable?"}
        I4[/"Context Injection"/]
        I5{{"Scope Lock"}}
        I1 --> I2 --> I3
        I3 -->|Yes| I4
        I3 -.->|No| I1
        I4 --> I5
    end

    subgraph COUNCIL["STAGE 2: AI COUNCIL"]
        direction TB
        C0{"Route Signal"}

        subgraph CL["Claude"]
            direction LR
            C1A>"Thread Archive"]
            C1B[/"Design System"/]
            C1C{{"Prompt Kit"}}
            C1A --> C1B --> C1C
        end

        subgraph GP["ChatGPT"]
            direction LR
            C2A[\\Draft Generator\\]
            C2B(["Variant Output"])
            C2A --> C2B
        end

        subgraph PX["Perplexity"]
            direction LR
            C3A[("Research Index")]
            C3B[/"Citation Report"/]
            C3A --> C3B
        end

        SYNTH((("Synthesis Gate")))

        C0 -->|Memory| C1A
        C0 -->|Prototype| C2A
        C0 -->|Verify| C3A
        C1C --> SYNTH
        C2B --> SYNTH
        C3B --> SYNTH
    end

    subgraph FORGE["STAGE 3: THE FORGE"]
        direction LR
        F1[\\Content Mold/]
        F2[/"Article Draft"/]
        F3[("Asset Store")]
        F4{{"Visual Render"}}
        F5>"Markdown Export"]
        F6(["Prompt Scaffold"])
        F1 --> F2 --> F3 --> F4
        F4 --> F5
        F4 --> F6
    end

    subgraph GAUNTLET["STAGE 4: QUALITY GAUNTLET"]
        direction TB
        G1{"ROY Check"}
        G2{{"Compression Test"}}
        G3["Kill Switch"]
        G4{"Brand Aligned?"}
        G5(["APPROVED"])
        G1 -->|Pass| G2
        G1 -->|Fail| G3
        G2 --> G4
        G4 -->|Yes| G5
        G4 -->|No| G3
        G3 -.->|Rework| F1
    end

    subgraph DEPLOY["STAGE 5: DISTRIBUTION ARRAY"]
        direction TB
        D0{"Channel Router"}

        subgraph SITES["Publishing Targets"]
            direction LR
            OKH(["overkillhill.com"])
            GFT(["glee-fully.tools"])
            AJB(["askjamie.bot"])
        end

        subgraph SUPPORT["Support Channels"]
            direction LR
            D2[("GitHub Repo")]
            D3[/"LinkedIn Post"/]
            D4>"Notion Archive"]
        end

        D0 -->|Article| OKH
        D0 -->|Tool| GFT
        D0 -->|Guide| AJB
        D0 -->|Code| D2
        D0 -->|Social| D3
        D0 -->|Record| D4
    end

    SPARK ==> I1
    I5 ==> C0
    SYNTH ==> F1
    F5 ==> G1
    G5 ==> D0

    D4 -.->|Metrics Feedback| SPARK
    D3 -.->|Engagement Signal| I2

    click OKH "https://overkillhill.com" _blank
    click GFT "https://glee-fully.tools" _blank
    click AJB "https://askjamie.bot" _blank`;
```

Note: Remove the classDef lines from the sample — those get injected by the theme engine. The sample should be raw, unstyled diagram content.

---

## TASK 5: BRAND SEPARATION RULES (PERMANENT)

These rules are non-negotiable and apply to all code, comments, presets, and documentation in this repository:

- No BFS, Builders FirstSource, or employer brand references anywhere
- Reject these BFS hex values if they appear in any context: #00205B, #003087, #002F86, #B3C1DB, #D6E5F9, #D0D0CE, #C8102E
- Acceptable presets are: the four generic presets (Ocean Depth, Forest Sage, Slate Ember, Violet Mist) plus the three personal brand presets (OverKill Hill P3, Glee-fully, AskJamie)
- Example diagrams must use generic, non-employer content
- Flag any BFS reference encountered in uploaded context documents to the user before proceeding

---

## PRIORITY ORDER

1. Add the three brand palette presets (Task 1)
2. Replace the sample diagram with the Content Machine (Task 4)
3. Implement the watermark/attribution toggle (Task 3)
4. Add version comment to detector.ts (Task 2)
5. Adjust palette grid layout if needed for 7 presets
