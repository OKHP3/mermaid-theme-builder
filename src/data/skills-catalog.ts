/**
 * Public Mermaid Agent Skills exposed by this repository.
 *
 * These entries mirror the skill packages under `skills/` in the repo root.
 * Each skill is published to GitHub and installable into any Agent
 * Skills-compatible AI client.
 *
 * Keep in sync with `skills/FAMILY.md` — add an entry here whenever a new
 * skill folder is added to `skills/`, and remove or mark deprecated when a
 * skill is retired.
 */

const SKILLS_BASE_URL = "https://github.com/OKHP3/mermaid-theme-builder/blob/main/skills";

export type SkillRole = "foundation" | "domain" | "workflow" | "tooling" | "governance";

export interface PublicSkill {
  /** Matches the directory name under `skills/` and the SKILL.md `name` field. */
  name: string;
  /** Human-readable short label shown in the UI. */
  displayName: string;
  /** Semantic version from the SKILL.md metadata. */
  version: string;
  /**
   * Role grouping:
   * - foundation  — must be loaded first; underpins other skills
   * - domain      — handles a specific diagram domain (architecture, BPMN, data)
   * - workflow    — handles a process stage (publish, repair, update)
   * - tooling     — applies themes, palettes, or governance automation
   * - governance  — establishes visual and behavioral standards across teams
   */
  role: SkillRole;
  /** One-sentence description shown in the skills list. */
  description: string;
  /** Direct link to the SKILL.md on GitHub. */
  githubUrl: string;
}

export const PUBLIC_MERMAID_SKILLS: PublicSkill[] = [
  {
    name: "okhp3-mermaid-core",
    displayName: "Mermaid Core",
    version: "0.3.0",
    role: "foundation",
    description:
      "Foundation skill for all Mermaid diagram work — load this first. Handles diagram type selection, the OKHP3 design system, file naming, and the three-gate validation framework.",
    githubUrl: `${SKILLS_BASE_URL}/okhp3-mermaid-core/SKILL.md`,
  },
  {
    name: "okhp3-mermaid-architecture",
    displayName: "Architecture",
    version: "0.3.0",
    role: "domain",
    description:
      "System and solution architecture diagrams — C4 model (Context/Container/Component/Code), architecture-beta cloud diagrams, block diagrams, and integration flows.",
    githubUrl: `${SKILLS_BASE_URL}/okhp3-mermaid-architecture/SKILL.md`,
  },
  {
    name: "okhp3-mermaid-bpmn",
    displayName: "BPMN / Business Process",
    version: "0.3.0",
    role: "domain",
    description:
      "BPMN-informed business process modeling — workflows, approval chains, swim lanes, cross-department handoffs, and decision gateways in Mermaid syntax.",
    githubUrl: `${SKILLS_BASE_URL}/okhp3-mermaid-bpmn/SKILL.md`,
  },
  {
    name: "okhp3-mermaid-data",
    displayName: "Data Models",
    version: "0.3.0",
    role: "domain",
    description:
      "Entity-relationship diagrams, class diagrams, and schema documentation — data models and object structures with cardinality and relationship annotations.",
    githubUrl: `${SKILLS_BASE_URL}/okhp3-mermaid-data/SKILL.md`,
  },
  {
    name: "okhp3-mermaid-theme-builder",
    displayName: "Theme Builder",
    version: "0.6.0",
    role: "tooling",
    description:
      "Apply reusable color palettes and visual governance to Mermaid diagrams — themeVariables blocks, %%{init}%% configuration, and renderer-safe styled output.",
    githubUrl: `${SKILLS_BASE_URL}/okhp3-mermaid-theme-builder/SKILL.md`,
  },
  {
    name: "okhp3-skill-promotion",
    displayName: "Skill Promotion",
    version: "0.1.0",
    role: "tooling",
    description:
      "Promote and synchronize a project-local Agent Skill into a portable, reviewable distribution package — provenance record, canonical family assignment, and safe handoff into OKHP3/skillz.",
    githubUrl: `${SKILLS_BASE_URL}/okhp3-skill-promotion/SKILL.md`,
  },
  {
    name: "okhp3-mermaid-governance",
    displayName: "Governance",
    version: "1.1.0",
    role: "governance",
    description:
      "Establish visual and behavioral standards for a diagram family — conformance profiles, style rules, and governance checks for consistent team output.",
    githubUrl: `${SKILLS_BASE_URL}/okhp3-mermaid-governance/SKILL.md`,
  },
  {
    name: "okhp3-mermaid-publish",
    displayName: "Publish & Export",
    version: "0.3.0",
    role: "workflow",
    description:
      "Render and publish finished diagrams — local PNG/SVG output, Markdown embedding, and Mermaid Chart MCP for shareable links. Use after passing all three validation gates.",
    githubUrl: `${SKILLS_BASE_URL}/okhp3-mermaid-publish/SKILL.md`,
  },
  {
    name: "okhp3-mermaid-repair",
    displayName: "Repair",
    version: "0.3.0",
    role: "workflow",
    description:
      "Syntax repair for broken Mermaid diagrams — diagnoses parse failures and applies the minimum fix without restructuring content, style, or labels.",
    githubUrl: `${SKILLS_BASE_URL}/okhp3-mermaid-repair/SKILL.md`,
  },
  {
    name: "okhp3-mermaid-update",
    displayName: "Update",
    version: "0.3.0",
    role: "workflow",
    description:
      "Style-preserving update of an existing diagram — applies the minimum diff for new nodes, revised labels, or restructured flow without touching classDef or theme config.",
    githubUrl: `${SKILLS_BASE_URL}/okhp3-mermaid-update/SKILL.md`,
  },
];

/** Role display metadata for UI badges. */
export const SKILL_ROLE_META: Record<SkillRole, { label: string; className: string }> = {
  foundation: {
    label: "Foundation",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  domain: {
    label: "Domain",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  workflow: {
    label: "Workflow",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  tooling: {
    label: "Tooling",
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  },
  governance: {
    label: "Governance",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
};
