export type ExampleDiagramType = "flowchart" | "sequence";

export interface PaletteExamples {
  flowchart: string;
  sequence: string;
}

const OVERKILL_HILL_FLOWCHART = `flowchart TD
    classDef primary fill:#111827,stroke:#c46a2c,color:#e5e7eb
    classDef secondary fill:#181f26,stroke:#c46a2c,color:#e5e7eb
    classDef gate fill:#c46a2c,stroke:#c46a2c,color:#0d1117
    classDef accent fill:#c46a2c,stroke:#c46a2c,color:#0d1117
    classDef platform fill:#111827,stroke:#c46a2c,color:#e6a03c,stroke-width:2px

    subgraph Client [Client Layer]
        A([User / API Consumer]):::platform
    end

    subgraph Gateway [API Gateway]
        B{Auth Check}:::gate
        C[Rate Limiter]:::secondary
    end

    subgraph Services [Service Layer]
        D[Request Router]:::primary
        E[Service A]:::primary
        F[Service B]:::primary
    end

    subgraph Data [Data Layer]
        G[(Primary Store)]:::secondary
        H[(Cache)]:::secondary
    end

    I([Response]):::accent

    A -->|Request| B
    B -->|Valid| C
    B -->|Invalid| I
    C -->|Allowed| D
    C -->|Throttled| I
    D --> E
    D --> F
    E --> G
    F --> H
    G --> I
    H --> I

    style Client fill:#0d1117,stroke:#c46a2c,color:#e6a03c
    style Gateway fill:#0d1117,stroke:#c46a2c,color:#e6a03c
    style Services fill:#0d1117,stroke:#c46a2c,color:#e6a03c
    style Data fill:#0d1117,stroke:#c46a2c,color:#e6a03c`;

const OVERKILL_HILL_SEQUENCE = `sequenceDiagram
    participant U as User
    participant O as Orchestrator
    participant P as Planner
    participant E as Executor
    participant S as Store

    U->>O: Submit task
    activate O
    O->>P: Plan task
    activate P
    P-->>O: Execution plan
    deactivate P

    loop For each step
        O->>E: Execute step
        activate E
        E->>S: Read context
        S-->>E: Context data
        E-->>O: Step result
        deactivate E
    end

    O->>S: Persist final output
    O-->>U: Task complete
    deactivate O`;

const ASKJAMIE_FLOWCHART = `flowchart TD
    classDef primary fill:#5b3a27,stroke:#c46a2c,color:#f6f2ee
    classDef gate fill:#c46a2c,stroke:#a06e28,color:#f6f2ee
    classDef secondary fill:#676a2c,stroke:#a06e28,color:#f6f2ee
    classDef accent fill:#e6a03c,stroke:#a06e28,color:#2a2320
    classDef outOfScope fill:#f6f2ee,stroke:#a06e28,color:#5b3a27,stroke-dasharray:5

    subgraph Intake [Request Intake]
        A([User submits question]):::primary
        B{Is question clear?}:::gate
        C[Ask for clarification]:::secondary
    end

    subgraph Resolution [Resolution Path]
        D{Found in knowledge base?}:::gate
        E[Return answer]:::accent
        F[Escalate to human agent]:::primary
    end

    subgraph Followup [Follow-up]
        G{Was it helpful?}:::gate
        H[Close ticket]:::accent
        I[Reopen with feedback]:::secondary
    end

    A --> B
    B -->|Yes| D
    B -->|No| C
    C --> B
    D -->|Yes| E
    D -->|No| F
    E --> G
    F --> G
    G -->|Yes| H
    G -->|No| I
    I --> D

    style Intake fill:#f0ebe5,stroke:#c46a2c,color:#2a2320
    style Resolution fill:#f0ebe5,stroke:#a06e28,color:#2a2320
    style Followup fill:#f0ebe5,stroke:#a06e28,color:#2a2320`;

const ASKJAMIE_SEQUENCE = `sequenceDiagram
    participant U as User
    participant A as AskJamie
    participant K as Knowledge Base
    participant H as Human Agent

    U->>A: Ask a question
    activate A
    A->>K: Search for answer
    activate K

    alt Answer found
        K-->>A: Matched article
        deactivate K
        A-->>U: Here's what I found
        U->>A: Was this helpful?
        A-->>U: Great! Ticket closed.
    else No match found
        K-->>A: No match
        deactivate K
        A->>H: Escalate ticket
        activate H
        H-->>U: Hi! I can help you with that.
        H-->>A: Resolved — update KB
        deactivate H
        A-->>U: Your ticket has been resolved.
    end

    deactivate A`;

const GLEE_FULLY_FLOWCHART = `flowchart TD
    classDef primary fill:#1c3a34,stroke:#2d6a4f,color:#f6f2ee
    classDef secondary fill:#52b788,stroke:#2d6a4f,color:#1c3a34
    classDef tertiary fill:#d8f3e6,stroke:#2d6a4f,color:#1c3a34
    classDef gate fill:#e6a03c,stroke:#2d6a4f,color:#1c3a34,font-weight:bold
    classDef accent fill:#2d6a4f,stroke:#1c3a34,color:#f6f2ee

    subgraph Morning [Morning Routine]
        A([Wake up]):::primary
        B[Drink water]:::secondary
        C{Workout today?}:::gate
        D[30-min workout]:::accent
        E[Stretch 10 min]:::tertiary
    end

    subgraph Planning [Daily Planning]
        F[Review today's goals]:::primary
        G{Goals clear?}:::gate
        H[Clarify one goal]:::secondary
        I[Write top 3 tasks]:::accent
    end

    subgraph Focus [Focus Block]
        J[Work on task 1]:::primary
        K{Done in session?}:::gate
        L[Take a break]:::tertiary
        M([Start next task]):::secondary
    end

    A --> B --> C
    C -->|Yes| D --> F
    C -->|No| E --> F
    F --> G
    G -->|Yes| I
    G -->|No| H --> G
    I --> J --> K
    K -->|Yes| M
    K -->|No| L --> J

    style Morning fill:#e8f7ef,stroke:#2d6a4f,color:#1c3a34
    style Planning fill:#e8f7ef,stroke:#2d6a4f,color:#1c3a34
    style Focus fill:#e8f7ef,stroke:#2d6a4f,color:#1c3a34`;

const GLEE_FULLY_SEQUENCE = `sequenceDiagram
    participant Me as Me
    participant App as Planner App
    participant Cal as Calendar
    participant Shop as Shopping List

    Me->>App: Open weekly planner
    activate App
    App->>Cal: Load this week's events
    Cal-->>App: Events loaded

    App-->>Me: Here's your week overview

    Me->>App: Plan meals for the week

    loop For each day
        App-->>Me: Suggest a meal
        Me->>App: Approve or swap
    end

    App->>Shop: Generate shopping list
    Shop-->>App: List ready
    App-->>Me: Your shopping list is ready!
    deactivate App

    Me->>Shop: Check off items while shopping
    Shop-->>Me: All done — enjoy your week!`;

export const BRAND_EXAMPLES: Record<string, PaletteExamples> = {
  "overkill-hill": {
    flowchart: OVERKILL_HILL_FLOWCHART,
    sequence: OVERKILL_HILL_SEQUENCE,
  },
  "askjamie": {
    flowchart: ASKJAMIE_FLOWCHART,
    sequence: ASKJAMIE_SEQUENCE,
  },
  "glee-fully": {
    flowchart: GLEE_FULLY_FLOWCHART,
    sequence: GLEE_FULLY_SEQUENCE,
  },
};

export const GENERIC_EXAMPLE = `flowchart TD
    A[User Request] --> B{Validate Input}
    B -->|Valid| C[Process Request]
    B -->|Invalid| D[Return Error]
    C --> E[Fetch Data]
    E --> F{Data Found?}
    F -->|Yes| G[Format Response]
    F -->|No| H[Return 404]
    G --> I[Send Response]`;

export const SHOWCASE_EXAMPLE = `---
config:
  layout: elk
  theme: redux-dark
---
flowchart LR
START["Random Thought Enters the Machine"]:::origin
SPARK["Spark"]:::hot
LEDGER["Notes, Threads, Prompts"]:::doc
COUNCIL["Council of AIs: useful or just shiny?"]:::council
DECIDE{"Worth Overdoing?"}:::decision

START ==> SPARK
SPARK --> LEDGER
LEDGER --> COUNCIL
COUNCIL --> DECIDE

DECIDE -->|"No, park it"| GRAVEYARD["Idea Graveyard"]:::muted
GRAVEYARD -."ferments".-> SPARK
DECIDE -->|"Yes, overdo it"| THESIS["Name the Pain"]:::okh

subgraph SG1["1. Sequence Engine: Context Distillation"]
direction TB
  S1A(("Input")):::sequence
  S1B["Voice Riff"]:::sequence
  S1C["Messy Transcript"]:::doc
  S1D["Extract Claims"]:::sequence
  S1E["Reusable Thesis Card"]:::artifact
  S1A --> S1B --> S1C --> S1D --> S1E
end

subgraph SG2["2. Timeline Forge: Maybe to Momentum"]
direction TB
  T0(("T+0")):::timeline
  T1["T+2 Name Product"]:::timeline
  T2["T+6 Debate Scope"]:::timeline
  T3["T+9 PRD Packet"]:::timeline
  T4(("T+12 Prototype")):::artifact
  T0 --> T1 --> T2 --> T3 --> T4
end

subgraph SG3["3. Brand Gravity Well"]
direction TB
  M0(("Personal Ecosystem")):::brand
  M1["OverKill Hill P3"]:::okh
  M2["AskJamie"]:::askjamie
  M3["Glee-fully"]:::glee
  M4["No employer bleed."]:::warning
  M0 --> M1
  M0 --> M2
  M0 --> M3
  M0 --> M4
end

subgraph SG4["4. Theme Builder Runtime"]
direction TB
  A1["Paste Mermaid"]:::input
  A2[("Palette Store")]:::data
  A3{"Theme Engine"}:::engine
  A4["Live Preview"]:::preview
  A5["Copy / Export"]:::output
  A1 --> A3
  A2 --> A3
  A3 --> A4
  A3 --> A5
end

subgraph SG5["5. Apply, Repair, Repeat"]
direction TB
  P1["Bland Diagram"]:::raw
  P2["Detect Family"]:::process
  P3{"Strong Support?"}:::decision
  P4["Full Theme"]:::success
  P5["Generic Only"]:::caution
  P6(("Styled Artifact")):::artifact
  P1 --> P2 --> P3
  P3 -->|"High"| P4 --> P6
  P3 -->|"Beta"| P5 --> P6
end

subgraph SG6["6. Governance: Safety and Attribution"]
direction TB
  G1{"Render Safety Scan"}:::govern
  G2[("Theme Metadata")]:::data
  G3["Source Comments: ON"]:::note
  G4["Export Bootstrap"]:::artifact
  G1 --> G2
  G2 --> G3
  G2 --> G4
end

THESIS --> SG1
SG1 --> SG2
SG2 --> SG3
SG3 --> SG4
SG4 --> SG5
SG5 --> SG6

SG6 ==> SHIP(("Ship it. Then sharpen it.")):::ship

OKH_LINK["overkillhill.com"]:::okhLink
GLEE_LINK["glee-fully.tools"]:::gleeLink
ASK_LINK["askjamie.bot"]:::askLink

SHIP --> OKH_LINK
SHIP --> GLEE_LINK
SHIP --> ASK_LINK

FOOTNOTE["Mermaid Theme Builder | OKH Protocol Dark | v0.2-alpha"]:::credit
SHIP -.-> FOOTNOTE

click OKH_LINK "https://overkillhill.com" _blank
click GLEE_LINK "https://glee-fully.tools" _blank
click ASK_LINK "https://askjamie.bot" _blank
click FOOTNOTE "https://overkillhill.com/projects/mermaid-theme-builder/" _blank

classDef origin fill:#0F172A,stroke:#38BDF8,stroke-width:3px,color:#F8FAFC
classDef hot fill:#7F1D1D,stroke:#F97316,stroke-width:2px,color:#FFF7ED
classDef doc fill:#1E293B,stroke:#93C5FD,stroke-width:1.5px,color:#DBEAFE
classDef council fill:#312E81,stroke:#818CF8,stroke-width:2px,color:#E0E7FF
classDef decision fill:#422006,stroke:#FBBF24,stroke-width:2px,color:#FEF3C7
classDef muted fill:#27272A,stroke:#71717A,stroke-width:1px,color:#A1A1AA
classDef okh fill:#581C87,stroke:#A78BFA,stroke-width:2px,color:#EDE9FE
classDef sequence fill:#14532D,stroke:#4ADE80,stroke-width:1.5px,color:#DCFCE7
classDef artifact fill:#4C1D95,stroke:#C084FC,stroke-width:2px,color:#F3E8FF
classDef timeline fill:#172554,stroke:#60A5FA,stroke-width:1.5px,color:#DBEAFE
classDef brand fill:#7C2D12,stroke:#FB923C,stroke-width:2px,color:#FED7AA
classDef askjamie fill:#065F46,stroke:#34D399,stroke-width:2px,color:#D1FAE5
classDef glee fill:#831843,stroke:#F472B6,stroke-width:2px,color:#FCE7F3
classDef warning fill:#713F12,stroke:#FBBF24,stroke-width:2px,color:#FEF3C7
classDef input fill:#1E3A8A,stroke:#60A5FA,stroke-width:1.5px,color:#DBEAFE
classDef data fill:#134E4A,stroke:#5EEAD4,stroke-width:1.5px,color:#CCFBF1
classDef engine fill:#701A75,stroke:#D946EF,stroke-width:2px,color:#FAE8FF
classDef preview fill:#6D28D9,stroke:#A78BFA,stroke-width:1.5px,color:#EDE9FE
classDef output fill:#0C4A6E,stroke:#38BDF8,stroke-width:1.5px,color:#E0F2FE
classDef raw fill:#374151,stroke:#9CA3AF,stroke-width:1px,color:#E5E7EB
classDef process fill:#064E3B,stroke:#34D399,stroke-width:1.5px,color:#D1FAE5
classDef success fill:#065F46,stroke:#10B981,stroke-width:2px,color:#D1FAE5
classDef caution fill:#92400E,stroke:#F59E0B,stroke-width:1.5px,color:#FEF3C7
classDef govern fill:#1E1B4B,stroke:#818CF8,stroke-width:2px,color:#E0E7FF
classDef note fill:#3F3F46,stroke:#A1A1AA,stroke-width:1px,color:#E4E4E7
classDef ship fill:#1E3A8A,stroke:#3B82F6,stroke-width:3px,color:#DBEAFE
classDef okhLink fill:#581C87,stroke:#A78BFA,stroke-width:2px,color:#EDE9FE
classDef gleeLink fill:#831843,stroke:#F472B6,stroke-width:2px,color:#FCE7F3
classDef askLink fill:#065F46,stroke:#34D399,stroke-width:2px,color:#D1FAE5
classDef credit fill:#18181B,stroke:#52525B,stroke-width:1px,color:#71717A`;

export const SHOWCASE_META = {
  title: "OverKill Rube Goldberg Showcase",
  description:
    "A deliberately complex sample diagram that demonstrates subgraphs, semantic classes, clickable nodes, attribution, and dark-mode theming.",
  tags: ["Showcase", "Advanced", "Stress test", "Flowchart", "ELK layout", "Clickable links"],
  warning:
    "Uses ELK layout, clickable nodes, and a rich classDef library. Some renderers may downgrade layout, ignore links, or render differently depending on Mermaid version and security settings.",
} as const;
