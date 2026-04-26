# The OverKill Hill Content Machine

> A Rube Goldberg in diagram form. Showcase diagram for Mermaid Theme Builder.
> 5 primary subgraphs, 7 total (nested), 30+ nodes, 8+ shape types, 3 hyperlinked brand nodes, 6 semantic classDef classes, bidirectional feedback loops.

## Diagram

```mermaid
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#1C3A34", "primaryTextColor": "#F6F2EE", "primaryBorderColor": "#E6A03C", "lineColor": "#2D6F7E", "secondaryColor": "#2D6F7E", "tertiaryColor": "#F6F2EE", "background": "#0d1117", "mainBkg": "#1C3A34", "nodeBorder": "#E6A03C", "clusterBkg": "#161b22", "clusterBorder": "#2D6F7E", "titleColor": "#E6A03C", "edgeLabelBackground": "#0d1117"}}}%%
flowchart TB
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
            C2A[\Draft Generator\]
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
        F1[\Content Mold/]
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
    click AJB "https://askjamie.bot" _blank

    classDef brand fill:#1C3A34,stroke:#E6A03C,stroke-width:3px,color:#F6F2EE
    classDef accent fill:#2D6F7E,stroke:#E6A03C,stroke-width:2px,color:#F6F2EE
    classDef gate fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fca5a5
    classDef signal fill:#E6A03C,stroke:#1C3A34,stroke-width:2px,color:#111827
    classDef kill fill:#450a0a,stroke:#dc2626,stroke-width:3px,color:#fca5a5
    classDef approved fill:#064e3b,stroke:#10b981,stroke-width:3px,color:#a7f3d0

    class OKH,GFT,AJB brand
    class SPARK,C0,D0 signal
    class I3,G1,G4 gate
    class G3 kill
    class G5 approved
    class SYNTH accent
```

## Features Demonstrated

| Feature | Count | Details |
|---------|-------|---------|
| Subgraphs | 7 (5 primary + 2 nested) | IGNITION, COUNCIL, FORGE, GAUNTLET, DEPLOY + nested CL/GP/PX, SITES, SUPPORT |
| Direction changes | 3 | TB (main), LR (IGNITION, FORGE, nested lanes), TB (COUNCIL, GAUNTLET, DEPLOY) |
| Shape types | 8+ | Circle, stadium, cylinder, diamond, hexagon, parallelogram-R, parallelogram-L, trapezoid, asymmetric, double-circle, triple-circle |
| Hyperlinked nodes | 3 | overkillhill.com, glee-fully.tools, askjamie.bot |
| Edge types | 4 | Solid arrow, dotted arrow, thick arrow (==>), labeled edges |
| classDef classes | 6 | brand, accent, gate, signal, kill, approved |
| Feedback loops | 2 | Metrics Feedback, Engagement Signal (both return to top) |
| Total nodes | 33 | Across all subgraphs |
| Total edges | 30+ | Including cross-subgraph connections |

## Theme Palette (OverKill Hill P3)

| Token | Hex | Role |
|-------|-----|------|
| primaryColor | #1C3A34 | Teal dark (node fill) |
| primaryTextColor | #F6F2EE | Paper cream (text) |
| primaryBorderColor | #E6A03C | Amber forge (borders) |
| lineColor | #2D6F7E | Teal accent (edges) |
| secondaryColor | #2D6F7E | Teal accent (secondary nodes) |
| background | #0d1117 | GitHub dark surface |
| clusterBkg | #161b22 | Subgraph panels |
| clusterBorder | #2D6F7E | Subgraph borders |

---

*Generated for Mermaid Theme Builder by OverKill Hill P3*
