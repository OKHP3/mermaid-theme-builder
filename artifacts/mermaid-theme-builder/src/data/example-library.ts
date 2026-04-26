export type ExampleCategory = "flow" | "structural" | "data-viz" | "timeline" | "specialty";

export interface ExampleEntry {
  id: string;
  label: string;
  family: string;
  category: ExampleCategory;
  content: string;
  badge?: string;
}

export interface ExampleGroup {
  category: ExampleCategory;
  label: string;
  entries: ExampleEntry[];
}

const FLOWCHART_BASIC = `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`;

const SEQUENCE_BASIC = `sequenceDiagram
    participant U as User
    participant S as System
    participant D as Database
    U->>S: Submit Request
    S->>D: Query Data
    D-->>S: Return Results
    S-->>U: Display Response`;

const CLASS_BASIC = `classDiagram
    class ThemeEngine {
        +Palette palette
        +generateCode(input)
        +applyTheme(code, palette)
    }
    class Palette {
        +String id
        +String name
        +ThemeColor[] colors
    }
    class ThemeColor {
        +String key
        +String label
        +String value
    }
    ThemeEngine --> Palette
    Palette --> ThemeColor`;

const CLASS_DOMAIN_MODEL = `classDiagram
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
    DiagramDetector --> DetectionResult : produces`;

const ER_THEME_REGISTRY = `erDiagram
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
    DIAGRAM_FAMILY ||--o{ EXPORT_EVENT : "detected in"`;

const STATE_THEME_LIFECYCLE = `stateDiagram-v2
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
    end note`;

const REQUIREMENT_SCOPE_FIREWALL = `requirementDiagram

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
    render_test - verifies -> mermaid_compat`;

const PIE_EFFORT_ALLOCATION = `pie showData
    title Development Effort Allocation
    "Planning + PRD" : 15
    "Design System Research" : 20
    "Core UI Build" : 25
    "Theme Engine Logic" : 15
    "Palette + Preset Design" : 10
    "Testing + Debugging" : 10
    "Documentation" : 5`;

const QUADRANT_OPPORTUNITY = `quadrantChart
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
    Fishbone: [0.3, 0.05]`;

const SANKEY_EFFORT_TO_OUTPUT = `sankey-beta

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
GitHub Pages,LinkedIn Article,10`;

const GANTT_BASIC = `gantt
    title Mermaid Theme Builder Roadmap
    dateFormat YYYY-MM-DD
    section Alpha
        Core UI           :done, a1, 2026-04-01, 14d
        Palette presets    :active, a2, 2026-04-15, 7d
        Showcase diagram   :a3, after a2, 5d
    section V1.0
        Example library    :b1, after a3, 10d
        Prompt packs       :b2, after b1, 7d
        GitHub Pages deploy:b3, after b2, 3d`;

const GANTT_ROADMAP = `gantt
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
        Diff view                      :v20c, after v20b, 7d`;

const TIMELINE_PROJECT_HISTORY = `timeline
    title Mermaid Theme Builder Project History
    section Origin
        2026-04-01 : Mermaid diagram styling pain identified
                   : Three-layer architecture conceived
        2026-04-05 : Design system v1 drafted (25 diagram types)
                   : Prompt kit synthesized from 4 AI sources
    section Naming + Planning
        2026-04-10 : Name research: Mermaid Theme Builder selected
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
                   : Legal analysis on color palettes completed`;

const JOURNEY_IDEA_TO_SHIP = `journey
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
        Share with Mermaid team: 5: Jamie`;

const GITGRAPH_REPO_EVOLUTION = `gitGraph
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
    merge v20-composer id: "release: v2.0"`;

const MINDMAP_ECOSYSTEM = `mindmap
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
        OKRs Are Invisible`;

export const EXAMPLE_CATALOG: ExampleEntry[] = [
  {
    id: "flowchart-basic",
    label: "Flowchart",
    family: "flowchart",
    category: "flow",
    content: FLOWCHART_BASIC,
  },
  {
    id: "sequence-basic",
    label: "Sequence",
    family: "sequence",
    category: "flow",
    content: SEQUENCE_BASIC,
  },
  {
    id: "class-basic",
    label: "Class diagram",
    family: "class",
    category: "structural",
    content: CLASS_BASIC,
  },
  {
    id: "class-domain-model",
    label: "Class — domain model",
    family: "class",
    category: "structural",
    content: CLASS_DOMAIN_MODEL,
  },
  {
    id: "er-theme-registry",
    label: "ER diagram",
    family: "er",
    category: "structural",
    content: ER_THEME_REGISTRY,
  },
  {
    id: "state-theme-lifecycle",
    label: "State machine",
    family: "state",
    category: "structural",
    content: STATE_THEME_LIFECYCLE,
  },
  {
    id: "requirement-scope-firewall",
    label: "Requirements",
    family: "requirement",
    category: "structural",
    content: REQUIREMENT_SCOPE_FIREWALL,
  },
  {
    id: "pie-effort-allocation",
    label: "Pie chart",
    family: "pie",
    category: "data-viz",
    content: PIE_EFFORT_ALLOCATION,
  },
  {
    id: "quadrant-opportunity",
    label: "Quadrant chart",
    family: "quadrant",
    category: "data-viz",
    content: QUADRANT_OPPORTUNITY,
  },
  {
    id: "sankey-effort-to-output",
    label: "Sankey",
    family: "sankey",
    category: "data-viz",
    content: SANKEY_EFFORT_TO_OUTPUT,
    badge: "Beta",
  },
  {
    id: "gantt-basic",
    label: "Gantt",
    family: "gantt",
    category: "data-viz",
    content: GANTT_BASIC,
  },
  {
    id: "gantt-roadmap",
    label: "Gantt — roadmap",
    family: "gantt",
    category: "data-viz",
    content: GANTT_ROADMAP,
  },
  {
    id: "timeline-project-history",
    label: "Timeline",
    family: "timeline",
    category: "timeline",
    content: TIMELINE_PROJECT_HISTORY,
  },
  {
    id: "journey-idea-to-ship",
    label: "User journey",
    family: "journey",
    category: "timeline",
    content: JOURNEY_IDEA_TO_SHIP,
  },
  {
    id: "gitgraph-repo-evolution",
    label: "Git graph",
    family: "gitgraph",
    category: "timeline",
    content: GITGRAPH_REPO_EVOLUTION,
  },
  {
    id: "mindmap-ecosystem",
    label: "Mindmap",
    family: "mindmap",
    category: "specialty",
    content: MINDMAP_ECOSYSTEM,
  },
];

export const EXAMPLE_GROUPS: ExampleGroup[] = [
  {
    category: "flow",
    label: "Flowchart & Sequence",
    entries: EXAMPLE_CATALOG.filter((e) => e.category === "flow"),
  },
  {
    category: "structural",
    label: "Structure & Models",
    entries: EXAMPLE_CATALOG.filter((e) => e.category === "structural"),
  },
  {
    category: "data-viz",
    label: "Data & Planning",
    entries: EXAMPLE_CATALOG.filter((e) => e.category === "data-viz"),
  },
  {
    category: "timeline",
    label: "Timeline & Journeys",
    entries: EXAMPLE_CATALOG.filter((e) => e.category === "timeline"),
  },
  {
    category: "specialty",
    label: "Specialty",
    entries: EXAMPLE_CATALOG.filter((e) => e.category === "specialty"),
  },
];
