export type ExampleCategory = "flow" | "structural" | "data-viz" | "timeline" | "specialty";

export interface ExampleEntry {
  id: string;
  label: string;
  family: string;
  category: ExampleCategory;
  content: string;
  badge?: string;
  description?: string;
  tags?: string[];
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

const FLOWCHART_OKH_OPERATING_SYSTEM = `flowchart TD
    IDEA([Random Thought])
    QUALIFY{Worth the Overdo?}
    PARK[[Idea Graveyard]]
    PAIN{{Name the Pain}}

    IDEA --> QUALIFY
    QUALIFY -- "No" --> PARK
    PARK -. "ferments" .-> IDEA
    QUALIFY -- "Yes" --> PAIN

    subgraph COUNCIL["AI Council Review"]
    direction LR
      CLAUDE[Claude: logic + depth]
      CHATGPT[ChatGPT: speed + breadth]
      PERPLEXITY[Perplexity: source validation]
      NOTION[/Notion: institutional memory/]
      CLAUDE --> NOTION
      CHATGPT --> NOTION
      PERPLEXITY --> NOTION
    end

    subgraph BUILD["Build Loop"]
    direction LR
      PRD[PRD in Notion]
      REPLIT([Replit prototype])
      ITERATE{Good enough?}
      FIX[Fix and iterate]
      PRD --> REPLIT --> ITERATE
      ITERATE -- "No" --> FIX --> REPLIT
    end

    subgraph SHIP["Ship + Govern"]
    direction LR
      FIREWALL{{Brand firewall scan}}
      GITHUB[(GitHub repo)]
      PAGES([GitHub Pages])
      ARTICLE[LinkedIn article]
      FIREWALL --> GITHUB --> PAGES
      GITHUB --> ARTICLE
    end

    PAIN --> COUNCIL
    COUNCIL --> BUILD
    ITERATE -- "Yes" --> SHIP

    OKH(overkillhill.com)
    ASK(askjamie.bot)
    GLEE(glee-fully.tools)

    SHIP --> OKH
    SHIP --> ASK
    SHIP --> GLEE`;

const SEQUENCE_BASIC = `sequenceDiagram
    participant U as User
    participant S as System
    participant D as Database
    U->>S: Submit Request
    S->>D: Query Data
    D-->>S: Return Results
    S-->>U: Display Response`;

const SEQUENCE_COUNCIL_TO_PROTOTYPE = `sequenceDiagram
    participant J as Jamie
    participant C as Claude
    participant G as ChatGPT
    participant P as Perplexity
    participant N as Notion
    participant R as Replit

    J->>C: Raw idea — is this worth overdoing?
    C-->>J: Analysis + framing + risks

    J->>G: Rapid concept sketch — name and positioning
    G-->>J: Name variants + tagline options

    J->>P: Prior art search — does this already exist?
    P-->>J: Source review + gap analysis

    Note over J,P: AI Council synthesis complete

    J->>N: Write PRD — scope, firewall, acceptance criteria
    N-->>J: Living document stored

    J->>C: Review PRD — what is missing?
    C-->>J: Gaps flagged + suggestions added
    J->>N: Update PRD with council feedback

    J->>R: Build prototype from PRD
    R-->>J: First working build

    loop Iteration
        J->>R: Fix + refine
        R-->>J: Updated prototype
    end

    J->>C: Review prototype — brand firewall clean?
    C-->>J: Firewall check passed. No employer-brand references.

    J->>R: Deploy to GitHub Pages
    R-->>J: Live URL confirmed

    Note over J,R: Shipped. Then sharpened.`;

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
        id: 1
        text: No employer branding or colors in any deliverable
        risk: high
        verifymethod: inspection
    }

    requirement static_only {
        id: 2
        text: No backend no login no API calls no data storage
        risk: medium
        verifymethod: test
    }

    requirement local_privacy {
        id: 3
        text: All transforms happen in browser and no data leaves it
        risk: medium
        verifymethod: inspection
    }

    requirement mermaid_compat {
        id: 4
        text: Generated output must render in Mermaid v11 renderers
        risk: medium
        verifymethod: test
    }`;

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

const MINDMAP_OKH_SYSTEM = `mindmap
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

const ISHIKAWA_PREMATURE_RENDERING = `mindmap
  root((Why does a diagram render incorrectly?))
    Syntax
      Missing init block
      Wrong diagram keyword
      Fences not stripped
      Unsupported node shape
    Renderer
      Mermaid version mismatch
      Beta diagram family
      Security level too strict
      ELK layout unavailable
    Theme
      Theme variables not injected
      Wrong family transform applied
      classDef overridden by global
      Init block duplicated
    Environment
      CDN load failure
      Stale browser cache
      Wrong securityLevel setting
      Renderer not initialized
    User Workflow
      Pasted with outer code fences
      Wrong palette for diagram type
      Applied generic theme to beta diagram
      Ignored renderer warning`;

// ── Batch #1: Mermaid.ai canonical basic examples ────────────────────────────

const FLOWCHART_MERMAID_BASIC = `flowchart TD
        A(["Start"])
        A --> B{"Decision"}
        B --> C["Option A"]
        B --> D["Option B"]`;

const SEQUENCE_MERMAID_BASIC = `sequenceDiagram
        actor Alice
        actor Bob
        Alice->>Bob: Hi Bob
        Bob->>Alice: Hi Alice`;

const CLASS_MERMAID_BASIC = `classDiagram
        Animal <|-- Duck
        Animal <|-- Fish
        Animal <|-- Zebra
        Animal : +int age
        Animal : +String gender
        Animal: +isMammal()
        Animal: +mate()
        class Duck {
          +String beakColor
          +swim()
          +quack()
        }
        class Fish {
          -int sizeInFeet
          -canEat()
        }
        class Zebra {
          +bool is_wild
          +run()
        }`;

const ER_MERMAID_BASIC = `erDiagram
    CUSTOMER }|..|{ DELIVERY-ADDRESS : has
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--o{ INVOICE : "liable for"
    DELIVERY-ADDRESS ||--o{ ORDER : receives
    INVOICE ||--|{ ORDER : covers
    ORDER ||--|{ ORDER-ITEM : includes
    PRODUCT-CATEGORY ||--|{ PRODUCT : contains
    PRODUCT ||--o{ ORDER-ITEM : "ordered in"`;

const STATE_MERMAID_BASIC = `stateDiagram
        [*] --> Still
        Still --> [*]
        Still --> Moving
        Moving --> Still
        Moving --> Crash
        Crash --> [*]`;

const REQUIREMENT_MERMAID_BASIC = `requirementDiagram
requirement test_req {
id: 1
text: the test text.
risk: high
verifyMethod: test
}
element test_entity {
type: simulation
}
test_entity - satisfies -> test_req`;

const BLOCK_MERMAID_BASIC = `block-beta
        columns 1
          db(("DB"))
          blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
          block:ID
            A
            B["A wide one in the middle"]
            C
          end
          space
          D
          ID --> D
          C --> D
          style B fill:#d6dadd,stroke:#333,stroke-width:4px`;

const C4_MERMAID_BASIC = `C4Context
    title System Context Diagram for E-commerce Platform

    Enterprise_Boundary(ecommerce, "E-commerce Platform Boundary") {
        Person(user, "User", "A customer using the e-commerce platform")
        System(ecomSystem, "E-commerce Platform", "Manages products, user accounts, orders, etc.")

        System_Ext(paymentGateway, "Payment Gateway", "Processes payments securely")
        System_Ext(notificationService, "Notification Service", "Sends notifications to users")

        Rel(user, ecomSystem, "Uses")
        Rel(ecomSystem, paymentGateway, "Processes payments via")
        Rel(ecomSystem, notificationService, "Notifies users via")
    }`;

const ARCHITECTURE_MERMAID_BASIC = `architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(server)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db`;

const PIE_MERMAID_BASIC = `pie title Pets adopted by volunteers
"Dogs" : 386
"Cats" : 85
"Rats" : 15`;

const QUADRANT_MERMAID_BASIC = `quadrantChart
title Reach and engagement of campaigns
x-axis Low Reach --> High Reach
y-axis Low Engagement --> High Engagement
quadrant-1 We should expand
quadrant-2 Need to promote
quadrant-3 Re-evaluate
quadrant-4 May be improved
Campaign A: [0.3, 0.6]
Campaign B: [0.45, 0.23]
Campaign C: [0.57, 0.69]
Campaign D: [0.78, 0.34]
Campaign E: [0.40, 0.34]
Campaign F: [0.35, 0.78]`;

const SANKEY_MERMAID_BASIC = `sankey-beta
Net Primary production %,Consumed energy %,85
Net Primary production %,Detritus %,15
Consumed energy %,Egested energy %,20%
Consumed energy %,Assimilated Energy %,65
Assimilated Energy %, Energy for Growth %, 25
Assimilated Energy %, Respired energy %, 40
Detritus %, Consumed by microbes %, 10
Detritus %, Stored in the earth %, 5`;

const GANTT_MERMAID_BASIC = `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`;

const RADAR_MERMAID_BASIC = `radar-beta
  axis m["Math"], s["Science"], e["English"]
  axis h["History"], g["Geography"], a["Art"]
  curve a["Alice"]{85, 90, 80, 70, 75, 90}
  curve b["Bob"]{70, 75, 85, 80, 90, 85}

  max 100
  min 0`;

const XYCHART_MERMAID_BASIC = `xychart-beta
  title "Training progress"
  x-axis [mon, tues, wed, thur, fri, sat, sun]
  y-axis "Time trained (minutes)" 0 --> 300
  bar [60, 0, 120, 180, 230, 300, 0]
  line [60, 0, 120, 180, 230, 300, 0]`;

const TIMELINE_MERMAID_BASIC = `timeline
    title Timeline of Industrial Revolution
    section 17th-20th century
        Industry 1.0 : Machinery, Water power, Steam <br>power
        Industry 2.0 : Electricity, Internal combustion engine, Mass production
        Industry 3.0 : Electronics, Computers, Automation
    section 21st century
        Industry 4.0 : Internet, Robotics, Internet of Things
        Industry 5.0 : Artificial intelligence, Big data,3D printing`;

const GITGRAPH_MERMAID_BASIC = `gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    commit`;

const MINDMAP_MERMAID_BASIC = `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularization
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid`;

const KANBAN_MERMAID_BASIC = `---
config:
  kanban:
    ticketBaseUrl: 'https://org.atlassian.net/browse/#TICKET#'
---
kanban
  Todo
    [Create Documentation]
    docs[Create Blog about the new diagram]
  [In progress]
    id6[Create renderer so that it works in all cases. We also add som extra text here for testing purposes. And some more just for the extra flare.]
  id9[Ready for deploy]
    id8[Design grammar]@{ assigned: 'knsv' }
  id10[Ready for test]
    id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }
    id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }
  id11[Done]
    id5[define getData]
    id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: MC-2036, priority: 'Very High'}
    id3[Update DB function]@{ ticket: MC-2037, assigned: knsv, priority: 'High' }

  id12[Can't reproduce]
    id3[Weird flickering in Firefox]`;

const PACKET_MERMAID_BASIC = `packet-beta
title UDP Packet
0-15: "Source Port"
16-31: "Destination Port"
32-47: "Length"
48-63: "Checksum"
64-95: "Data (variable length)"`;

// ── Batch #3: OKH contextual + emulation + new families ──────────────────────

const VENN_GOVERNANCE_TRIANGLE = `venn-beta
  title The Governance Triangle

  A[Measure]
  B[Document]
  C[Diagram]

  A&B[Auditable Records]
  B&C[Annotated Diagrams]
  A&C[Metric Visualizations]
  A&B&C[Visual Governance]`;

const ISHIKAWA_RENDER_FAILURE = `%%{init: {"theme": "base"} }%%
fishbone
    title Why does a Mermaid diagram render incorrectly?
    accTitle: Root cause analysis - premature or incorrect rendering
    section Syntax
        Missing init block : Syntax
        Wrong diagram keyword : Syntax
        Fences not stripped : Syntax
        Unsupported node shape : Syntax
    section Renderer
        Mermaid version mismatch : Renderer
        Beta diagram family : Renderer
        Security level too strict : Renderer
        ELK layout unavailable : Renderer
    section Theme
        Theme variables not injected : Theme
        Wrong family transform applied : Theme
        classDef overridden by global : Theme
        Init block duplicated : Theme
    section Environment
        CDN load failure : Environment
        Stale browser cache : Environment
        Wrong securityLevel setting : Environment
        Renderer not initialized : Environment
    section User Workflow
        Pasted with outer code fences : Workflow
        Wrong palette for diagram type : Workflow
        Applied generic theme to beta diagram : Workflow
        Ignored renderer warning : Workflow`;

const BPMN_LITE_PROCESS = `flowchart LR
%% BPMN-like approximation — not BPMN 2.0 compliant
%% Mermaid subgraphs emulate BPMN pools and lanes.
%% For true BPMN 2.0, use a dedicated tool such as bpmn.io.

subgraph REQUESTER["Pool: Requester — Jamie"]
  direction TB
  START([Start])
  SUBMIT[Submit Tool Request]
  REVIEW_RESULT{Outcome?}
  USE_TOOL([Use Tool])
  END([End])
end

subgraph COUNCIL["Pool: AI Council Review"]
  direction TB
  RECEIVE[Receive Request]
  ASSESS{Worth Building?}
  APPROVE[Approve + Scope]
  REJECT[Reject + Log Idea]
end

subgraph BUILD_AGENT["Pool: Replit Build Agent"]
  direction TB
  BUILD[Build Prototype]
  TEST{Tests Pass?}
  ITERATE[Iterate]
  SHIP[Ship to GitHub Pages]
end

START --> SUBMIT
SUBMIT --> RECEIVE
RECEIVE --> ASSESS
ASSESS -->|Yes| APPROVE
ASSESS -->|No| REJECT
REJECT --> REVIEW_RESULT
APPROVE --> BUILD
BUILD --> TEST
TEST -->|No| ITERATE
ITERATE --> BUILD
TEST -->|Yes| SHIP
SHIP --> REVIEW_RESULT
REVIEW_RESULT -->|Approved| USE_TOOL
REVIEW_RESULT -->|Revise| SUBMIT
USE_TOOL --> END`;

const C4_OKH_ECOSYSTEM = `C4Context
  title Overkill Hill P³ — Tool Ecosystem Context

  Person(jamie, "Jamie Hill", "Builder, author, tool author")

  System(mtb, "Mermaid Theme Builder", "Visual governance for AI-generated Mermaid diagrams")
  System(forge, "OKH Forge", "Personal tooling suite and brand system")

  System_Ext(mermaid, "Mermaid.js", "Open-source diagram renderer")
  System_Ext(llm, "AI Assistant", "LLM used to generate Mermaid diagrams")
  System_Ext(renderer, "Target Renderer", "GitHub / Notion / Obsidian / etc.")

  Rel(jamie, mtb, "Builds themes using")
  Rel(jamie, llm, "Prompts for diagrams")
  Rel(mtb, mermaid, "Renders previews via")
  Rel(mtb, llm, "Exports prompt scaffold to")
  Rel(llm, renderer, "Outputs themed Mermaid to")
  Rel(mtb, forge, "Part of")`;

const ARCHITECTURE_STATIC_APP = `architecture-beta
  group browser(cloud)[Browser]
    service vite(server)[Vite Dev Server]
    service app(disk)[React App]
  end

  group cdn(cloud)[GitHub Pages CDN]
    service pages(server)[Static Files]
  end

  service mermaidjs(internet)[Mermaid.js]

  app:R --> mermaidjs:L
  vite:R --> app:L
  pages:R --> app:L`;

const XYCHART_CLARITY_VELOCITY = `xychart-beta
  title "Clarity Velocity — Sprints 1–6"
  x-axis ["S1", "S2", "S3", "S4", "S5", "S6"]
  y-axis "Story Points" 0 --> 50
  bar [22, 28, 31, 27, 38, 42]
  line [20, 24, 29, 30, 35, 41]`;

const BLOCK_PRODUCT_MODULES = `block-beta
  columns 3

  block:Apply["Apply Tab"]:1
  block:Compose["Compose Tab"]:1
  block:Examples["Examples Tab"]:1
  block:Reference["Reference Tab"]:1

  block:ThemeEngine["Theme Engine"]:2
  block:Detector["Family Detector"]:1

  block:Palettes["Palette Store"]:1
  block:Persistence["Persistence"]:1
  block:Export["Exporters"]:1`;

const ZENUML_COUNCIL_FLOW = `zenuml
  title Council to Prototype Flow

  @Actor Jamie
  @Boundary AI
  @Database ThemeStore

  Jamie -> AI: "Draft a flowchart for user auth"
  AI -> Jamie: return diagram code
  Jamie -> ThemeStore: applyTheme(palette)
  ThemeStore -> Jamie: return themedCode
  Jamie -> AI: "Refine with scaffold"
  AI -> Jamie: return finalDiagram`;

const KANBAN_OKH_ALPHA_BOARD = `kanban
  title Mermaid Theme Builder — Public Alpha Board

  column Backlog
    task Registry truth pass
    task Renderer parity matrix
    task Typography 5-tier model

  column In Progress
    task Prompt scaffold hardening
    task Test coverage

  column Done
    task Family detection
    task Palette editor
    task Extract mode
    task Share URL
    task Example library`;

// ── Batch #2 ─────────────────────────────────────────────────────────────────

const JOURNEY_MERMAID_BASIC = `journey
title My working day
section Go to work
  Make tea: 5: Me
  Go upstairs: 3: Me
  Do work: 1: Me, Cat
section Go home
  Go downstairs: 5: Me
  Sit down: 5: Me`;

const TREEMAP_MERMAID_BASIC = `treemap-beta
"Category A"
    "Item A1": 10
    "Item A2": 20
"Category B"
    "Item B1": 15
    "Item B2": 25`;

const FLOWCHART_THEME_ENGINE_CONTEXTUAL = `%%{init: {"theme":"base","securityLevel":"loose","flowchart":{"curve":"basis","htmlLabels":true},"themeVariables":{"background":"#0B1020","fontFamily":"Segoe UI, Arial, Helvetica, sans-serif","primaryColor":"#111827","primaryTextColor":"#F9FAFB","primaryBorderColor":"#60A5FA","lineColor":"#60A5FA","secondaryColor":"#1F2937","tertiaryColor":"#312E81","clusterBkg":"#111827","clusterBorder":"#60A5FA","edgeLabelBackground":"#0B1020","textColor":"#F9FAFB"}}}%%
flowchart LR
%% Theme: OKH Protocol Dark
%% Created with: Mermaid Theme Builder by OverKill Hill P3
%% Tool: https://overkillhill.com/projects/mermaid-theme-builder/

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

linkStyle default stroke:#60A5FA,stroke-width:1.7px`;

const FLOWCHART_MERMAID_AI_CONTEXTUAL = `---
config:
  layout: elk
  theme: neutral
---
flowchart RL
 subgraph THINK_MODE["💡 Think Mode — Context First, Rendering Second"]
    direction TB
        T1(["Narrative Input<br>(the problem space)"])
        T2(["Logic Layer<br>(system rules &amp; relationships)"])
        T3(["Mapping Stage<br>(connecting functions)"])
        T4{{"Hold Phase 🧘<br>Model absorbs context"}}
        T5(["Synthesis 🧩<br>Integrate &amp; verify understanding"])
        T6(["Rendering 🎨<br>Diagram reflects synthesis"])
  end
 subgraph PREMATURE_RENDERING["⚡ Premature Rendering — Speed Without Synthesis"]
    direction TB
        P1(["Prompt Detected"])
        P2{{"Instant Execution ⏩"}}
        P3(["Surface Coherence<br>(looks right, incomplete)"])
        P4(["Correction Loops 🔁"])
  end
    T1 --> T2
    T2 --> T3
    T3 --> T4
    T4 --> T5
    T5 --> T6
    P1 --> P2
    P2 --> P3
    P3 --> P4
    THINK_MODE -- Structured understanding before speed --> O1(("✅ Durable Insight"))
    PREMATURE_RENDERING -- Output first, meaning later --> O2(("⚠️ Plausible but Incomplete"))
    O1 -. Encourages discipline .-> PREMATURE_RENDERING
    O2 -. Reminds need for Think Mode .-> THINK_MODE

     T1:::indigo
     T2:::teal
     T3:::cyan
     T4:::violet
     T5:::green
     T6:::lime
     P1:::orange
     P2:::red
     P3:::rose
     P4:::yellow
     O1:::green
     O2:::red
    classDef indigo stroke:#818cf8,fill:#eef2ff
    classDef teal stroke:#2dd4bf,fill:#f0fdfa
    classDef cyan stroke:#22d3ee,fill:#ecfeff
    classDef violet stroke:#a78bfa,fill:#f5f3ff
    classDef green stroke:#4ade80,fill:#f0fdf4
    classDef lime stroke:#a3e635,fill:#f7fee7
    classDef orange stroke:#fb923c,fill:#fff7ed
    classDef red stroke:#f87171,fill:#fef2f2
    classDef rose stroke:#fb7185,fill:#fff1f2
    classDef yellow stroke:#facc15,fill:#fefce8`;

export const EXAMPLE_CATALOG: ExampleEntry[] = [
  {
    id: "flowchart-basic",
    label: "Flowchart",
    family: "flowchart",
    category: "flow",
    content: FLOWCHART_BASIC,
  },
  {
    id: "flowchart-overkill-operating-system",
    label: "Flowchart — OKH operating system",
    family: "flowchart",
    category: "flow",
    content: FLOWCHART_OKH_OPERATING_SYSTEM,
  },
  {
    id: "sequence-basic",
    label: "Sequence",
    family: "sequence",
    category: "flow",
    content: SEQUENCE_BASIC,
  },
  {
    id: "sequence-council-to-prototype",
    label: "Sequence — council to prototype",
    family: "sequence",
    category: "flow",
    content: SEQUENCE_COUNCIL_TO_PROTOTYPE,
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
    id: "gantt-mermaid-theme-builder-roadmap",
    label: "Gantt — roadmap",
    family: "gantt",
    category: "data-viz",
    content: GANTT_ROADMAP,
  },
  {
    id: "timeline-overkill-theme-builder-history",
    label: "Timeline",
    family: "timeline",
    category: "timeline",
    content: TIMELINE_PROJECT_HISTORY,
  },
  {
    id: "journey-idea-to-shipped-tool",
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
    id: "mindmap-overkill-hill-system",
    label: "Mindmap — OKH system",
    family: "mindmap",
    category: "specialty",
    content: MINDMAP_OKH_SYSTEM,
  },
  {
    id: "ishikawa-premature-rendering-root-cause",
    label: "Root cause — rendering errors",
    family: "mindmap",
    category: "specialty",
    content: ISHIKAWA_PREMATURE_RENDERING,
  },
  {
    id: "eventmodeling-order-lifecycle",
    label: "Event Modeling — order lifecycle",
    family: "eventModeling",
    category: "specialty",
    content: `eventmodeling
title Order Processing System
`,
    badge: "Experimental",
  },
  {
    id: "wardley-diagram-generation-value-chain",
    label: "Wardley — diagram value chain",
    family: "wardley",
    category: "specialty",
    content: `wardley-beta
  title Diagram Generation Value Chain
  anchor User Need [0.95, 0.50]
  component AI Prompt [0.82, 0.65]
  component Mermaid Code [0.65, 0.55]
  component Styling [0.50, 0.30]
  component Rendered Diagram [0.35, 0.70]
  component Published Doc [0.20, 0.85]
  User Need -> AI Prompt
  AI Prompt -> Mermaid Code
  Mermaid Code -> Styling
  Styling -> Rendered Diagram
  Rendered Diagram -> Published Doc
  evolve Styling 0.65
`,
    badge: "Beta",
  },

  // ── Batch #1: Mermaid.ai canonical basic examples ──────────────────────────
  // flow
  {
    id: "flowchart-mermaid-basic",
    label: "Flowchart — basic",
    family: "flowchart",
    category: "flow",
    content: FLOWCHART_MERMAID_BASIC,
    badge: "Canonical",
  },
  {
    id: "sequence-mermaid-basic",
    label: "Sequence — hello world",
    family: "sequence",
    category: "flow",
    content: SEQUENCE_MERMAID_BASIC,
    badge: "Canonical",
  },
  // structural
  {
    id: "class-mermaid-basic",
    label: "Class — animal hierarchy",
    family: "class",
    category: "structural",
    content: CLASS_MERMAID_BASIC,
    badge: "Canonical",
  },
  {
    id: "er-mermaid-basic",
    label: "ER diagram — e-commerce",
    family: "er",
    category: "structural",
    content: ER_MERMAID_BASIC,
    badge: "Canonical",
  },
  {
    id: "state-mermaid-basic",
    label: "State — basic transitions",
    family: "state",
    category: "structural",
    content: STATE_MERMAID_BASIC,
    badge: "Canonical",
  },
  {
    id: "requirement-mermaid-basic",
    label: "Requirements — basic",
    family: "requirement",
    category: "structural",
    content: REQUIREMENT_MERMAID_BASIC,
    badge: "Canonical",
  },
  {
    id: "block-mermaid-basic",
    label: "Block diagram",
    family: "block",
    category: "structural",
    content: BLOCK_MERMAID_BASIC,
    badge: "Canonical",
  },
  {
    id: "c4-mermaid-basic",
    label: "C4 context — e-commerce",
    family: "c4",
    category: "structural",
    content: C4_MERMAID_BASIC,
    badge: "Canonical",
  },
  // data-viz
  {
    id: "pie-mermaid-basic",
    label: "Pie chart — pets",
    family: "pie",
    category: "data-viz",
    content: PIE_MERMAID_BASIC,
    badge: "Canonical",
  },
  {
    id: "quadrant-mermaid-basic",
    label: "Quadrant — campaigns",
    family: "quadrant",
    category: "data-viz",
    content: QUADRANT_MERMAID_BASIC,
    badge: "Canonical",
  },
  {
    id: "sankey-mermaid-basic",
    label: "Sankey — energy flow",
    family: "sankey",
    category: "data-viz",
    content: SANKEY_MERMAID_BASIC,
    badge: "Canonical · Beta",
  },
  {
    id: "gantt-mermaid-basic",
    label: "Gantt — basic",
    family: "gantt",
    category: "data-viz",
    content: GANTT_MERMAID_BASIC,
    badge: "Canonical",
  },
  {
    id: "radar-mermaid-basic",
    label: "Radar — student scores",
    family: "radar",
    category: "data-viz",
    content: RADAR_MERMAID_BASIC,
    badge: "Canonical · Beta",
  },
  {
    id: "xychart-mermaid-basic",
    label: "XY chart — training progress",
    family: "xychart",
    category: "data-viz",
    content: XYCHART_MERMAID_BASIC,
    badge: "Canonical · Beta",
  },
  // timeline
  {
    id: "timeline-mermaid-basic",
    label: "Timeline — industrial revolution",
    family: "timeline",
    category: "timeline",
    content: TIMELINE_MERMAID_BASIC,
    badge: "Canonical",
  },
  {
    id: "gitgraph-mermaid-basic",
    label: "Git graph — basic branching",
    family: "gitgraph",
    category: "timeline",
    content: GITGRAPH_MERMAID_BASIC,
    badge: "Canonical",
  },
  // specialty
  {
    id: "mindmap-mermaid-basic",
    label: "Mindmap — basic",
    family: "mindmap",
    category: "specialty",
    content: MINDMAP_MERMAID_BASIC,
    badge: "Canonical",
  },
  {
    id: "architecture-mermaid-basic",
    label: "Architecture — cloud API",
    family: "architectureBeta",
    category: "specialty",
    content: ARCHITECTURE_MERMAID_BASIC,
    badge: "Canonical · Beta",
  },
  {
    id: "kanban-mermaid-basic",
    label: "Kanban board",
    family: "kanban",
    category: "specialty",
    content: KANBAN_MERMAID_BASIC,
    badge: "Canonical · Beta",
  },
  {
    id: "packet-mermaid-basic",
    label: "Packet — UDP",
    family: "packet",
    category: "specialty",
    content: PACKET_MERMAID_BASIC,
    badge: "Canonical · Beta",
  },

  // ── Batch #2 ────────────────────────────────────────────────────────────────
  // timeline
  {
    id: "journey-mermaid-basic",
    label: "User journey — working day",
    family: "journey",
    category: "timeline",
    content: JOURNEY_MERMAID_BASIC,
    badge: "Canonical",
  },
  // data-viz
  {
    id: "treemap-mermaid-basic",
    label: "Treemap — categories",
    family: "treemap",
    category: "data-viz",
    content: TREEMAP_MERMAID_BASIC,
    badge: "Canonical · Beta",
  },
  // flow — showcase & contextual examples
  {
    id: "flowchart-theme-engine-contextual",
    label: "Flowchart — OKH Protocol Dark showcase",
    family: "flowchart",
    category: "flow",
    content: FLOWCHART_THEME_ENGINE_CONTEXTUAL,
  },
  {
    id: "flowchart-mermaid-ai-contextual",
    label: "Flowchart — Think Mode vs Premature Rendering",
    family: "flowchart",
    category: "flow",
    content: FLOWCHART_MERMAID_AI_CONTEXTUAL,
  },

  // ── Batch #3: OKH contextual + emulation + new families ────────────────────

  // BPMN-lite emulation — flowchart approximating BPMN pools and lanes
  {
    id: "bpmn-lite-process",
    label: "BPMN-lite — tool request process (approximation)",
    family: "flowchart",
    category: "flow",
    content: BPMN_LITE_PROCESS,
    badge: "BPMN approx. only",
    description:
      "A Mermaid flowchart that emulates BPMN-style pools and lanes using subgraphs. Approximates a three-pool tool-request process across Requester, AI Council, and Build Agent roles.",
    tags: ["BPMN", "emulation", "process", "flowchart", "OKH", "approximation"],
  },

  // C4 — OKH ecosystem context diagram
  {
    id: "c4-context-overkill-ecosystem",
    label: "C4 context — OKH tool ecosystem",
    family: "c4",
    category: "structural",
    content: C4_OKH_ECOSYSTEM,
    description:
      "C4 Context diagram showing the Overkill Hill P³ tool ecosystem — Jamie, Mermaid Theme Builder, OKH Forge, and their external relationships to Mermaid.js, AI assistants, and target renderers.",
    tags: ["C4", "architecture", "OKH", "context diagram", "overkillhill.com"],
  },

  // Architecture — static app deployment
  {
    id: "architecture-static-app",
    label: "Architecture — static app deployment",
    family: "architectureBeta",
    category: "specialty",
    content: ARCHITECTURE_STATIC_APP,
    badge: "Beta",
    description:
      "Architecture diagram showing the Mermaid Theme Builder's static deployment topology: Vite dev server, React app, GitHub Pages CDN, and Mermaid.js as an external service.",
    tags: ["architecture", "deployment", "static", "GitHub Pages", "Vite", "beta"],
  },

  // XY chart — OKH sprint velocity
  {
    id: "xychart-clarity-velocity",
    label: "XY chart — clarity velocity, sprints 1–6",
    family: "xychart",
    category: "data-viz",
    content: XYCHART_CLARITY_VELOCITY,
    badge: "Beta",
    description:
      "XY bar + line chart tracking story point velocity across six sprints. Illustrates trend analysis and sprint comparison for the OKH project.",
    tags: ["XY chart", "velocity", "sprints", "bar", "line", "beta", "data visualization"],
  },

  // Block diagram — product modules
  {
    id: "block-product-modules",
    label: "Block diagram — product module map",
    family: "block",
    category: "structural",
    content: BLOCK_PRODUCT_MODULES,
    badge: "Beta",
    description:
      "Block diagram laying out the four UI tabs and three core library modules of the Mermaid Theme Builder — Apply, Compose, Examples, Reference tabs plus Theme Engine, Palette Store, and Exporters.",
    tags: ["block", "modules", "product", "architecture", "beta"],
  },

  // ZenUML — council to prototype flow
  {
    id: "zenuml-council-prototype-flow",
    label: "ZenUML — council to prototype flow",
    family: "zenuml",
    category: "flow",
    content: ZENUML_COUNCIL_FLOW,
    description:
      "ZenUML code-first sequence diagram showing the OKH workflow from prompt to themed diagram: Jamie, AI assistant, and ThemeStore interaction.",
    tags: ["ZenUML", "sequence", "OKH", "AI", "prototype", "code-first"],
  },

  // Kanban — OKH public alpha board
  {
    id: "kanban-public-alpha-board",
    label: "Kanban — OKH public alpha board",
    family: "kanban",
    category: "specialty",
    content: KANBAN_OKH_ALPHA_BOARD,
    badge: "Beta",
    description:
      "Kanban board showing the Mermaid Theme Builder public alpha work — Backlog, In Progress, and Done columns with real task cards from the project.",
    tags: ["kanban", "project management", "OKH", "alpha", "beta"],
  },

  // Venn — governance triangle (beta)
  {
    id: "venn-governance-triangle",
    label: "Venn — governance triangle",
    family: "venn",
    category: "specialty",
    content: VENN_GOVERNANCE_TRIANGLE,
    badge: "Beta — may not render in all environments",
    description:
      "Venn diagram showing the three-way overlap of Measure, Document, and Diagram — the Visual Governance triangle at the core of the OKH methodology.",
    tags: ["venn", "governance", "OKH", "beta", "set diagram"],
  },

  // Ishikawa — render failure root cause (beta)
  {
    id: "ishikawa-render-failure",
    label: "Ishikawa (fishbone) — render failure root cause",
    family: "ishikawa",
    category: "specialty",
    content: ISHIKAWA_RENDER_FAILURE,
    badge: "Beta — may not render in all environments",
    description:
      "Fishbone (Ishikawa) diagram using Mermaid's native fishbone syntax to analyze root causes of diagram rendering failures — covering Syntax, Renderer, Theme, Environment, and User Workflow categories.",
    tags: ["ishikawa", "fishbone", "root cause", "beta", "quality", "rendering"],
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
