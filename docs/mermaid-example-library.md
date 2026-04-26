# Mermaid Theme Builder — Example Diagram Library

> **For Replit**: Parse this file and extract each fenced code block into its own `.mmd` file under `artifacts/mermaid-theme-builder/public/examples/`. The filename is specified in the heading above each block. The `SAMPLE_CODE` and `SIMPLE_SAMPLE` constants go into `ThemeBuilder.tsx` as the default loaded diagrams.

---

## Default Samples (load into ThemeBuilder.tsx)

### SIMPLE_SAMPLE (ThemeBuilder.tsx constant)

Use this as the default loaded diagram when the app opens. Simple, fast to render, universally compatible.

````mermaid
flowchart TD
    A[User Request] --> B{Validate Input}
    B -->|Valid| C[Process Request]
    B -->|Invalid| D[Return Error]
    C --> E[Fetch Data]
    E --> F{Data Found?}
    F -->|Yes| G[Format Response]
    F -->|No| H[Return 404]
    G --> I[Send Response]
````

### SAMPLE_CODE / overkill-rube-goldberg-wow.mmd (ThemeBuilder.tsx constant + examples/ file)

The showcase diagram. Also save as `examples/overkill-rube-goldberg-wow.mmd`. Use as the "Load Showcase" option in the example selector.

````mermaid
flowchart LR
%% Theme: OKH Protocol Dark
%% Created with: Mermaid Theme Builder by OverKill Hill P3

START@{ shape: stadium, label: "Random Thought Enters the Machine" }:::origin
SPARK@{ shape: bolt, label: "Spark" }:::hot
LEDGER@{ shape: docs, label: "Notes, Threads, Prompts" }:::doc
COUNCIL@{ shape: braces, label: "Council of AIs: useful or just shiny?" }:::council
DECIDE@{ shape: diamond, label: "Worth Overdoing?" }:::decision

START e_start@==> SPARK
SPARK e_collect@--> LEDGER
LEDGER e_interrogate@--> COUNCIL
COUNCIL e_decide@--> DECIDE

DECIDE -- "No, park it" --> GRAVEYARD@{ shape: bow-rect, label: "Idea Graveyard" }:::muted
GRAVEYARD -. "ferments" .-> SPARK
DECIDE -- "Yes, overdo it" --> THESIS@{ shape: hex, label: "Name the Pain" }:::okh

subgraph SG1["1. Sequence Engine: Context Distillation"]
direction TB
  S1A@{ shape: circle, label: "Input" }:::sequence
  S1B@{ shape: stadium, label: "Voice Riff" }:::sequence
  S1C@{ shape: doc, label: "Messy Transcript" }:::doc
  S1D@{ shape: div-rect, label: "Extract Claims" }:::sequence
  S1E@{ shape: notch-rect, label: "Reusable Thesis Card" }:::artifact
  S1A --> S1B --> S1C --> S1D --> S1E
end

subgraph SG2["2. Timeline Forge: Maybe to Momentum"]
direction TB
  T0@{ shape: sm-circ, label: "T+0" }:::timeline
  T1@{ shape: flag, label: "T+2 Name Product" }:::timeline
  T2@{ shape: hourglass, label: "T+6 Debate Scope" }:::timeline
  T3@{ shape: doc, label: "T+9 PRD Packet" }:::timeline
  T4@{ shape: framed-circle, label: "T+12 Prototype" }:::artifact
  T0 --> T1 --> T2 --> T3 --> T4
end

subgraph SG3["3. Brand Gravity Well"]
direction TB
  M0@{ shape: dbl-circ, label: "Personal Ecosystem" }:::brand
  M1@{ shape: curv-trap, label: "OverKill Hill P3" }:::okh
  M2@{ shape: stadium, label: "AskJamie" }:::askjamie
  M3@{ shape: stadium, label: "Glee-fully" }:::glee
  M4@{ shape: comment, label: "No BFS. No employer bleed." }:::warning
  M0 --> M1
  M0 --> M2
  M0 --> M3
  M0 --> M4
end

subgraph SG4["4. Theme Builder Runtime"]
direction TB
  A1@{ shape: lean-r, label: "Paste Mermaid" }:::input
  A2@{ shape: cyl, label: "Palette Store" }:::data
  A3@{ shape: hex, label: "Theme Engine" }:::engine
  A4@{ shape: curv-trap, label: "Live Preview" }:::preview
  A5@{ shape: lean-l, label: "Copy / Export" }:::output
  A1 --> A3
  A2 --> A3
  A3 --> A4
  A3 --> A5
end

subgraph SG5["5. Apply, Repair, Repeat"]
direction TB
  P1@{ shape: lean-r, label: "Bland Diagram" }:::raw
  P2@{ shape: trap-t, label: "Detect Family" }:::process
  P3@{ shape: diamond, label: "Strong Support?" }:::decision
  P4@{ shape: tag-rect, label: "Full Theme" }:::success
  P5@{ shape: notch-rect, label: "Generic Only" }:::caution
  P6@{ shape: dbl-circ, label: "Styled Artifact" }:::artifact
  P1 --> P2 --> P3
  P3 -- "High" --> P4 --> P6
  P3 -- "Beta" --> P5 --> P6
end

subgraph SG6["6. Governance: Safety and Attribution"]
direction TB
  G1@{ shape: hex, label: "Render Safety Scan" }:::govern
  G2@{ shape: cyl, label: "Theme Metadata" }:::data
  G3@{ shape: comment, label: "Source Comments: ON" }:::note
  G4@{ shape: flag, label: "Export Bootstrap" }:::artifact
  G1 --> G2
  G2 --> G3
  G2 --> G4
end

THESIS e_s1@--> SG1
SG1 e_s2@--> SG2
SG2 e_s3@--> SG3
SG3 e_s4@--> SG4
SG4 e_s5@--> SG5
SG5 e_s6@--> SG6

SG6 e_ship@==> SHIP@{ shape: dbl-circ, label: "Ship it. Then sharpen it." }:::ship

OKH_LINK@{ shape: curv-trap, label: "overkillhill.com" }:::okhLink
GLEE_LINK@{ shape: curv-trap, label: "glee-fully.tools" }:::gleeLink
ASK_LINK@{ shape: curv-trap, label: "askjamie.bot" }:::askLink

SHIP --> OKH_LINK
SHIP --> GLEE_LINK
SHIP --> ASK_LINK

FOOTNOTE@{ shape: text, label: "Mermaid Theme Builder | OKH Protocol Dark | v0.2-alpha" }:::credit
SHIP -.-> FOOTNOTE

click OKH_LINK "https://overkillhill.com" _blank
click GLEE_LINK "https://glee-fully.tools" _blank
click ASK_LINK "https://askjamie.bot" _blank
click FOOTNOTE "https://overkillhill.com/projects/mermaid-theme-builder/" _blank

e_start@{ animation: fast }
e_collect@{ animation: slow }
e_interrogate@{ animation: slow }
e_decide@{ animation: fast }
e_s1@{ animation: fast }
e_s2@{ animation: fast }
e_s3@{ animation: fast }
e_s4@{ animation: fast }
e_s5@{ animation: fast }
e_s6@{ animation: fast }
e_ship@{ animation: fast }

classDef origin fill:#0F172A,stroke:#38BDF8,stroke-width:3px,color:#F8FAFC
classDef hot fill:#7F1D1D,stroke:#F97316,stroke-width:2px,color:#FFF7ED
classDef doc fill:#1E293B,stroke:#93C5FD,stroke-width:1.5px,color:#DBEAFE
classDef council fill:#312E81,stroke:#A78BFA,stroke-width:2px,color:#F5F3FF
classDef decision fill:#422006,stroke:#FACC15,stroke-width:2px,color:#FEFCE8
classDef muted fill:#27272A,stroke:#71717A,stroke-width:1.5px,color:#D4D4D8
classDef okh fill:#111827,stroke:#60A5FA,stroke-width:2.5px,color:#EFF6FF
classDef sequence fill:#0C4A6E,stroke:#38BDF8,stroke-width:1.5px,color:#E0F2FE
classDef timeline fill:#064E3B,stroke:#34D399,stroke-width:1.5px,color:#ECFDF5
classDef brand fill:#312E81,stroke:#C4B5FD,stroke-width:2.5px,color:#F5F3FF
classDef askjamie fill:#1E3A8A,stroke:#93C5FD,stroke-width:2px,color:#EFF6FF
classDef glee fill:#365314,stroke:#BEF264,stroke-width:2px,color:#F7FEE7
classDef warning fill:#7F1D1D,stroke:#FCA5A5,stroke-width:2px,color:#FEF2F2
classDef note fill:#1F2937,stroke:#D1D5DB,stroke-width:1.2px,color:#F9FAFB
classDef input fill:#083344,stroke:#67E8F9,stroke-width:1.5px,color:#ECFEFF
classDef data fill:#172554,stroke:#60A5FA,stroke-width:1.5px,color:#EFF6FF
classDef engine fill:#581C87,stroke:#D8B4FE,stroke-width:2.5px,color:#FAF5FF
classDef preview fill:#064E3B,stroke:#6EE7B7,stroke-width:2px,color:#ECFDF5
classDef output fill:#713F12,stroke:#FDE68A,stroke-width:2px,color:#FFFBEB
classDef raw fill:#3F3F46,stroke:#A1A1AA,stroke-width:1.5px,color:#F4F4F5
classDef process fill:#1E40AF,stroke:#BFDBFE,stroke-width:1.5px,color:#EFF6FF
classDef success fill:#14532D,stroke:#86EFAC,stroke-width:2px,color:#F0FDF4
classDef caution fill:#78350F,stroke:#FBBF24,stroke-width:2px,color:#FFFBEB
classDef artifact fill:#164E63,stroke:#67E8F9,stroke-width:2.5px,color:#ECFEFF
classDef govern fill:#312E81,stroke:#A78BFA,stroke-width:2px,color:#F5F3FF
classDef ship fill:#020617,stroke:#FACC15,stroke-width:4px,color:#FEFCE8
classDef okhLink fill:#0F172A,stroke:#60A5FA,stroke-width:3px,color:#DBEAFE
classDef gleeLink fill:#365314,stroke:#BEF264,stroke-width:3px,color:#F7FEE7
classDef askLink fill:#1E3A8A,stroke:#93C5FD,stroke-width:3px,color:#EFF6FF
classDef credit fill:#111827,stroke:#64748B,stroke-width:1px,color:#CBD5E1

style SG1 fill:#082F49,stroke:#38BDF8,stroke-width:2px,color:#E0F2FE
style SG2 fill:#052E2B,stroke:#34D399,stroke-width:2px,color:#ECFDF5
style SG3 fill:#1E1B4B,stroke:#A78BFA,stroke-width:2px,color:#F5F3FF
style SG4 fill:#111827,stroke:#60A5FA,stroke-width:2px,color:#EFF6FF
style SG5 fill:#1C1917,stroke:#FBBF24,stroke-width:2px,color:#FFFBEB
style SG6 fill:#18181B,stroke:#D1D5DB,stroke-width:2px,color:#F9FAFB

linkStyle default stroke:#60A5FA,stroke-width:1.7px
````

---

## Tier 1 Examples (save to examples/ directory)

### examples/flowchart-basic.mmd

Basic flowchart demonstrating standard shapes, decisions, and branching. Compatible with all renderers.

````mermaid
flowchart TD
    A([Start]) --> B[Collect Requirements]
    B --> C{Requirements Clear?}
    C -->|Yes| D[Design Solution]
    C -->|No| E[Schedule Workshop]
    E --> B
    D --> F[Build Prototype]
    F --> G{Stakeholder Approved?}
    G -->|Yes| H[Deploy to Production]
    G -->|No| I[Gather Feedback]
    I --> D
    H --> J([End])
````

### examples/sequence-basic.mmd

Sequence diagram showing API authentication flow with activation bars, notes, and alt fragments.

````mermaid
sequenceDiagram
    actor User
    participant App as Mobile App
    participant API as API Gateway
    participant Auth as Auth Service
    participant DB as Database

    User->>App: Open Application
    App->>API: POST /auth/login
    API->>Auth: Validate Credentials

    alt Valid Credentials
        Auth->>DB: Lookup User Record
        DB-->>Auth: User Data
        Auth-->>API: JWT Token
        API-->>App: 200 OK + Token
        App-->>User: Dashboard
    else Invalid Credentials
        Auth-->>API: 401 Unauthorized
        API-->>App: Error Response
        App-->>User: "Invalid credentials"
    end

    Note over App,Auth: Token expires after 60 minutes
    User->>App: Request Protected Resource
    App->>API: GET /data (Bearer Token)
    API->>Auth: Verify Token
    Auth-->>API: Token Valid
    API->>DB: Fetch Data
    DB-->>API: Results
    API-->>App: 200 OK + Data
    App-->>User: Display Results
````

### examples/class-domain-model.mmd

Class diagram modeling the Mermaid Theme Builder's own domain. Demonstrates inheritance, composition, and method signatures.

````mermaid
classDiagram
    class ThemeEngine {
        +Palette activePalette
        +WatermarkOptions watermark
        +generateThemedCode(input, options) String
        +generateMarkdownExport(code, name) String
        +generatePromptScaffold(palette, family) String
    }

    class Palette {
        +String id
        +String name
        +String description
        +ThemeColor[] colors
        +clone() Palette
    }

    class ThemeColor {
        +String key
        +String label
        +String value
        +isHex() Boolean
    }

    class DiagramDetector {
        +detectFamily(code) DetectionResult
        -matchPatterns(code) DiagramFamily
    }

    class DetectionResult {
        +DiagramFamily family
        +String label
        +Boolean hasThemeInit
        +String[] warnings
    }

    class WatermarkOptions {
        +Boolean enabled
        +String themeName
        +String toolUrl
    }

    class PresetRegistry {
        +Palette[] builtInPalettes
        +getPalette(id) Palette
        +listPalettes() Palette[]
    }

    ThemeEngine --> Palette : uses
    ThemeEngine --> DiagramDetector : depends on
    ThemeEngine --> WatermarkOptions : configured by
    Palette *-- ThemeColor : contains
    PresetRegistry o-- Palette : manages
    DiagramDetector --> DetectionResult : produces
````

### examples/state-theme-lifecycle.mmd

State diagram showing the lifecycle of a theme from selection through customization to export.

````mermaid
stateDiagram-v2
    [*] --> Idle : App loads

    state Idle {
        [*] --> DefaultPreset
        DefaultPreset --> PresetSelected : User picks palette
    }

    state Editing {
        [*] --> ColorAdjustment
        ColorAdjustment --> ColorAdjustment : Change color value
        ColorAdjustment --> FontChange : Edit font family
        FontChange --> ColorAdjustment : Back to colors
    }

    state Preview {
        [*] --> Rendering
        Rendering --> Rendered : Success
        Rendering --> RenderError : Parse failure
        RenderError --> Rendering : Code corrected
    }

    state Export {
        [*] --> ChooseFormat
        ChooseFormat --> StyledCode : Copy code
        ChooseFormat --> Markdown : Export bootstrap
        ChooseFormat --> PromptScaffold : Export scaffold
    }

    Idle --> Editing : Edit colors
    Idle --> Preview : Paste diagram
    Editing --> Preview : Preview updates live
    Preview --> Export : User exports
    Export --> Idle : Start over
    Editing --> Idle : Reset palette

    note right of Editing
        All edits are local.
        No data leaves the browser.
    end note
````

### examples/er-theme-registry.mmd

Entity-relationship diagram modeling a theme registry with palettes, colors, and export history.

````mermaid
erDiagram
    PALETTE ||--o{ THEME_COLOR : contains
    PALETTE {
        string id PK
        string name
        string description
        string fontFamily
        datetime createdAt
        datetime updatedAt
    }

    THEME_COLOR {
        string key PK
        string paletteId FK
        string label
        string hexValue
        int sortOrder
    }

    USER_SESSION ||--o{ EXPORT_EVENT : generates
    USER_SESSION {
        string sessionId PK
        string activePaletteId FK
        boolean watermarkEnabled
        string customThemeName
        datetime startedAt
    }

    EXPORT_EVENT {
        string exportId PK
        string sessionId FK
        string exportType
        string diagramFamily
        datetime exportedAt
    }

    DIAGRAM_FAMILY ||--o{ THEME_VARIABLE : supports
    DIAGRAM_FAMILY {
        string familyId PK
        string label
        string mermaidKey
        string supportLevel
    }

    THEME_VARIABLE {
        string variableKey PK
        string familyId FK
        string defaultValue
        string description
    }

    PALETTE ||--o{ USER_SESSION : "active in"
    DIAGRAM_FAMILY ||--o{ EXPORT_EVENT : "detected in"
````

### examples/gantt-roadmap.mmd

Gantt chart showing the Mermaid Theme Builder project roadmap from alpha through V2.0.

````mermaid
gantt
    title Mermaid Theme Builder Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section V0.1 Alpha
        Core UI + paste/preview       :done, v01a, 2026-04-01, 14d
        4 generic palette presets      :done, v01b, after v01a, 5d
        Copy/export buttons            :done, v01c, after v01b, 3d
        Diagram family detection       :done, v01d, after v01b, 4d

    section V0.2 Alpha
        3 brand palette presets        :active, v02a, 2026-04-25, 3d
        Showcase diagram integration   :v02b, after v02a, 2d
        Watermark attribution toggle   :v02c, after v02b, 3d
        Example selector UI            :v02d, after v02b, 4d
        LICENSE + AGENTS.md + README   :v02e, after v02a, 2d
        GitHub Pages deploy pipeline   :v02f, after v02e, 2d

    section V1.0 Public
        Family-specific themeVariables :v10a, after v02f, 7d
        Font selector dropdown         :v10b, after v10a, 3d
        33 example diagrams            :v10c, after v10a, 10d
        Design system docs             :v10d, after v10c, 5d

    section V2.0 Two-Way
        Extract mode (reverse parse)   :v20a, after v10d, 14d
        Bidirectional color binding    :v20b, after v20a, 10d
        Diff view                      :v20c, after v20b, 7d
````

### examples/mindmap-ecosystem.mmd

Mindmap showing the OverKill Hill personal ecosystem and how the Mermaid Theme Builder fits within it.

````mermaid
mindmap
  root((OverKill Hill P3))
    Precision
      Mermaid Theme Builder
        Compose Mode
        Apply Mode
        Extract Mode
      Design Systems
        Color Tokens
        Font Stacks
        Semantic Classes
      Diagram Taxonomy
        91 Types Cataloged
        21 Mermaid Native
        12 Emulatable
    Protocol
      Brand Separation
        No employer bleed
        Personal IP only
      Visual Governance
        Reusable themes
        Prompt scaffolds
        Bootstrap exports
      Content Pipeline
        Claude: institutional memory
        ChatGPT: rapid prototype
        Perplexity: source validator
        Notion: documentarian
    Promptcraft
      ROY Principle
        Understanding produced
        Explanation invested
      AI Council Model
        Multi-AI synthesis
        Best-of-breed merge
      Article Thesis
        First Diagram Is a Liar
        OKRs Are Invisible
````

### examples/journey-idea-to-ship.mmd

User journey map showing the experience of taking an idea from concept to shipped tool.

````mermaid
journey
    title From Random Thought to Shipped Tool
    section Spark
        Have a random idea: 3: Jamie
        Debate if it is useful: 2: Jamie, Claude
        Name the pain it solves: 4: Jamie
    section Research
        Search for prior art: 3: Perplexity
        Check Mermaid docs: 2: Jamie
        Draft positioning: 4: Claude, ChatGPT
    section Build
        Write PRD in Notion: 4: Jamie, Claude
        Scaffold repo in Replit: 3: Replit
        Iterate on UI: 4: Jamie, Replit
        Fix rendering bugs: 2: Jamie
    section Ship
        Push to GitHub: 5: Jamie
        Deploy to GitHub Pages: 4: Jamie
        Write LinkedIn article: 3: Jamie, Claude
        Share with Mermaid team: 5: Jamie
````

### examples/pie-effort-allocation.mmd

Pie chart showing where development effort went during the Mermaid Theme Builder build.

````mermaid
pie showData
    title Development Effort Allocation
    "Planning + PRD" : 15
    "Design System Research" : 20
    "Core UI Build" : 25
    "Theme Engine Logic" : 15
    "Palette + Preset Design" : 10
    "Testing + Debugging" : 10
    "Documentation" : 5
````

### examples/timeline-project-history.mmd

Timeline showing the chronological milestones of the Mermaid Theme Builder project.

````mermaid
timeline
    title Mermaid Theme Builder Project History
    section Origin
        2026-04-01 : BFS Mermaid styling pain identified
                   : Three-layer architecture conceived
        2026-04-05 : Design system v1 drafted (25 diagram types)
                   : Prompt kit synthesized from 4 AI sources
    section Naming + Planning
        2026-04-10 : Name research: "Mermaid Theme Builder" selected
                   : PRD created in Notion
                   : Brand separation directive established
    section Build
        2026-04-15 : Replit builds prototype from PRD
                   : GitHub repo created (OKHP3/mermaid-theme-builder)
                   : 4 generic palette presets ship
    section V0.2
        2026-04-25 : 3 brand presets defined (OKH, Glee-fully, AskJamie)
                   : Showcase diagram merged (Claude + ChatGPT)
                   : 91-type diagram taxonomy cataloged
                   : Legal analysis on color palettes completed
````

### examples/quadrant-opportunity.mmd

Quadrant chart mapping diagram types by theme confidence vs. user demand, showing where Mermaid Theme Builder adds the most value.

````mermaid
quadrantChart
    title Diagram Types: Theme Confidence vs. User Demand
    x-axis Low Demand --> High Demand
    y-axis Low Theme Confidence --> High Theme Confidence
    quadrant-1 Sweet spot
    quadrant-2 Invest in theming
    quadrant-3 Deprioritize
    quadrant-4 Watch and wait
    Flowchart: [0.9, 0.95]
    Sequence Diagram: [0.85, 0.9]
    Class Diagram: [0.7, 0.85]
    ERD: [0.75, 0.85]
    Gantt: [0.6, 0.8]
    Mind Map: [0.65, 0.7]
    State Diagram: [0.5, 0.8]
    Pie Chart: [0.5, 0.6]
    C4 Model: [0.55, 0.75]
    BPMN: [0.8, 0.1]
    Use Case: [0.6, 0.1]
    Wardley Map: [0.4, 0.05]
    Org Chart: [0.7, 0.3]
    Fishbone: [0.3, 0.05]
````

### examples/gitgraph-repo-evolution.mmd

Git graph showing the branching strategy for the Mermaid Theme Builder repository.

````mermaid
gitGraph
    commit id: "init: repo scaffold"
    commit id: "feat: core UI"
    branch v02-alpha
    checkout v02-alpha
    commit id: "feat: brand presets"
    commit id: "feat: showcase diagram"
    commit id: "feat: watermark toggle"
    commit id: "docs: LICENSE + AGENTS"
    commit id: "ci: GitHub Pages"
    checkout main
    merge v02-alpha id: "release: v0.2-alpha"
    branch v10-public
    checkout v10-public
    commit id: "feat: family themeVars"
    commit id: "feat: example selector"
    commit id: "feat: font dropdown"
    commit id: "docs: design system"
    checkout main
    merge v10-public id: "release: v1.0"
    branch v20-composer
    checkout v20-composer
    commit id: "feat: extract mode"
    commit id: "feat: bidirectional bind"
    commit id: "feat: diff view"
    checkout main
    merge v20-composer id: "release: v2.0"
````

### examples/sankey-effort-to-output.mmd

Sankey diagram showing how effort flows from input activities to output artifacts.

````mermaid
sankey-beta

Research,Design System,20
Research,Legal Analysis,10
Research,Naming Study,5
Planning,PRD,15
Planning,Notion Build Plan,10
AI Council,Claude Artifacts,25
AI Council,ChatGPT Drafts,15
AI Council,Perplexity Sources,10
Design System,Theme Engine,20
PRD,Replit Build,15
Notion Build Plan,Replit Build,10
Claude Artifacts,Replit Build,15
ChatGPT Drafts,Replit Build,10
Replit Build,GitHub Repo,30
Replit Build,Live Prototype,20
GitHub Repo,GitHub Pages,30
Live Prototype,LinkedIn Article,15
GitHub Pages,LinkedIn Article,10
````

### examples/requirement-scope-firewall.mmd

Requirement diagram showing the scope constraints and their verification relationships.

````mermaid
requirementDiagram

    requirement brand_separation {
        id: REQ-001
        text: No BFS branding, colors, or references in any deliverable
        risk: high
        verifymethod: inspection
    }

    requirement static_only {
        id: REQ-002
        text: No backend, no login, no API calls, no data storage
        risk: medium
        verifymethod: test
    }

    requirement local_privacy {
        id: REQ-003
        text: All transforms happen client-side; no data leaves the browser
        risk: medium
        verifymethod: inspection
    }

    requirement mermaid_compat {
        id: REQ-004
        text: Generated output must render in Mermaid v11.x renderers
        risk: medium
        verifymethod: test
    }

    element scope_audit {
        type: test
        docref: AGENTS.md
    }

    element render_test {
        type: test
        docref: examples/*.mmd
    }

    scope_audit - verifies -> brand_separation
    scope_audit - verifies -> static_only
    scope_audit - verifies -> local_privacy
    render_test - verifies -> mermaid_compat
````

---

## Inventory Summary

| # | Filename | Diagram Type | Mermaid Key | Purpose |
|---|----------|-------------|-------------|---------|
| 1 | (SIMPLE_SAMPLE constant) | Flowchart | flowchart | Default loaded diagram |
| 2 | overkill-rube-goldberg-wow.mmd | Flowchart (showcase) | flowchart | Stress test / wow factor |
| 3 | flowchart-basic.mmd | Flowchart | flowchart | Basic process flow |
| 4 | sequence-basic.mmd | Sequence | sequenceDiagram | API auth flow |
| 5 | class-domain-model.mmd | Class | classDiagram | Theme Builder domain |
| 6 | state-theme-lifecycle.mmd | State | stateDiagram-v2 | Theme lifecycle |
| 7 | er-theme-registry.mmd | ER | erDiagram | Theme data model |
| 8 | gantt-roadmap.mmd | Gantt | gantt | Project roadmap |
| 9 | mindmap-ecosystem.mmd | Mindmap | mindmap | OverKill Hill system |
| 10 | journey-idea-to-ship.mmd | Journey | journey | Idea-to-shipped experience |
| 11 | pie-effort-allocation.mmd | Pie | pie | Effort distribution |
| 12 | timeline-project-history.mmd | Timeline | timeline | Project milestones |
| 13 | quadrant-opportunity.mmd | Quadrant | quadrantChart | Opportunity mapping |
| 14 | gitgraph-repo-evolution.mmd | Git Graph | gitGraph | Branching strategy |
| 15 | sankey-effort-to-output.mmd | Sankey | sankey-beta | Effort-to-artifact flow |
| 16 | requirement-scope-firewall.mmd | Requirement | requirementDiagram | Scope constraints |

**Coverage**: 12 of 21 Mermaid-native diagram types represented. Remaining types (block-beta, xychart-beta, C4 variants, zenuml, packet-beta, architecture-beta, kanban) are Tier 2 for V1.0.
