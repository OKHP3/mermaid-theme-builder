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
