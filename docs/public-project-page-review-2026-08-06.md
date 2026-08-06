# Public Project Page Review: Mermaid Theme Builder

**Review date:** 2026-08-06  
**Reviewed public page:** <https://overkillhill.com/projects/mermaid-theme-builder/>  
**Reviewed source page:** <https://github.com/OKHP3/OverKill-Hill/blob/main/projects/mermaid-theme-builder/index.html>  
**Linked Replit surface:** <https://replit.com/t/overkill-hill/repls/OverKill-Hill>

## Decision

The public project page conveys the right high-level positioning, but it is not
an accurate current source of truth for Mermaid Theme Builder. Treat public-page
truth alignment as a P0 release task before using this page for further product
promotion.

The page successfully communicates the core problem, frames the product as a
governance layer rather than a generic diagram editor, embeds the live tool, and
links to the tool, research, and source repository. The public narrative needs
to be updated to match the current live product and its verified boundaries.

## Evidence reviewed

| Surface | Status | Evidence |
|---|---|---|
| Public project page | Reviewed live | The page loaded, embedded the live application, and exposed launch/full-screen actions. |
| Embedded application | Reviewed live | The iframe reported `v0.6.1-e54b273` and exposed Compose, Apply, Examples, Reference, and Extract. |
| Current application repository | Reviewed locally | `package.json` is `0.6.1`; the live Reference tab reports 31 Mermaid families and 10 public Agent Skills. |
| Project-page source | Reviewed public source | The linked GitHub file is the separately maintained public-page source. |
| Linked Replit project | Blocked | The supplied URL redirected to Replit login. No authenticated inspection or sign-in was attempted. |

## Material accuracy gaps

| Priority | Public claim or presentation | Current evidence | Required correction |
|---|---|---|---|
| P0 | `v0.5.0 Shipped`, `v0.5.0: Shipped May 2026`, and `v0.5.x SKILL.md Hardening` | The live iframe is `v0.6.1-e54b273`; the current repository release is 0.6.1. | Update badges, Current Release content, and active-sprint copy to 0.6.1 facts. |
| P0 | Four route links list Compose, Apply, Examples, and Reference. | Extract is a live top-level application tab. | Add an Extract route and describe its outcome. |
| P0 | “8-skill SKILL.md family.” | The current public skill catalog has 10 skills. | Update count and list or replace the count with generated catalog wording. |
| P0 | “27+ diagram-family capability matrix.” | The live reference reports 31 tracked Mermaid families. | Use current count with a linked, versioned capability registry. |
| P0 | “TypeScript 6.0.3.” | `package.json` pins TypeScript `~7.0.2`. | Correct the technical stack. |
| P0 | “The workbench runs without a network connection after the first visit” and “works offline after first load.” | Service-worker registration and a manifest exist, but the release evidence explicitly says offline behavior has not been automatically verified. | Narrow copy to “installable PWA” until a production offline check passes. |
| P0 | “Close the tab and nothing is stored anywhere” and “no data leaves your machine.” | The app intentionally persists state in browser local storage. It also offers an opt-in Mermaid Live handoff that encodes themed code in a third-party URL fragment. | Say that normal processing is local and data is stored only in the browser unless the user exports, shares, or opens Mermaid Live. Explain the explicit handoff. |
| P1 | “Not Mermaid: it does not generate, parse, or render Mermaid syntax itself.” | The application dynamically loads Mermaid and renders browser previews. | State that it does not replace Mermaid or author diagram structure. It does render previews through Mermaid. |
| P1 | “Full HSL/RGB pickers.” | The current UI uses a native color picker with editable color values, not dedicated HSL/RGB controls. | Change to “native color picker and editable color values,” or build the claimed controls. |
| P1 | “Every claimed behavior is a passing test” and parity accuracy wording. | Automated tests and deployment checks exist, but some renderer findings are field-observed or unverified. | Describe test coverage without claiming live validation for every host renderer. Show evidence status in the application and public copy. |
| P1 | “No data collection” without runtime nuance. | The application makes third-party Google Fonts requests at load time. This is not analytics or diagram-content collection. | Either self-host fonts or say that no diagram content or analytics data is collected, while identifying third-party font loading. |

## Product-story assessment

The strongest public story is already present:

> Mermaid Theme Builder is a local-first visual governance layer for
> AI-generated Mermaid diagrams.

The page should make the reusable artifact equally explicit:

> Create or extract a Governance Profile once. Apply it to diagrams, check it
> against a target renderer, and distribute it as styled code, Markdown, JSON,
> or an AI-ready Prompt Scaffold.

This wording matches the current workbench and gives the embedded tool, public
skills, renderer matrix, and export surfaces one coherent purpose.

### Entry experience

The current “Launch Theme Builder” link goes to `#compose`. This puts profile
construction ahead of the most common stated job: apply a profile to Mermaid
code and export usable output. Change the primary launch action to `#apply` and
retain Compose as a secondary “Create a Governance Profile” path.

The page should offer four outcome-oriented paths near the hero:

1. **Apply an existing diagram**
2. **Create a Governance Profile**
3. **Extract an existing theme**
4. **Use a profile with an AI agent**

### Embedded-workbench presentation

The embedded live tool is useful proof, but the full project page is long and
reads as a product manual around an iframe. Prefer a short preview, concise
proof points, and a prominent full-screen application action. Keep detailed
capability, test, and research material behind focused links rather than
repeating it all in the project-page body.

## Recommended public-page content structure

1. **Hero:** clear outcome, current version, Launch Apply, Create Profile, and
   View Source actions.
2. **Why it exists:** three concise problem statements: visual drift, renderer
   variance, and reusable AI instruction.
3. **How it works:** Compose or Extract Profile -> Apply -> Validate -> Export
   or Distribute.
4. **Live proof:** a compact responsive embed and a full-screen link.
5. **Outputs:** Styled Mermaid, Markdown, Profile JSON/share link, Prompt
   Scaffold, and public Agent Skills.
6. **Trust boundary:** local processing, local storage, explicit third-party
   handoff, renderer-evidence limits, and non-affiliation disclaimer.
7. **Current release:** a generated or release-record-backed summary. Avoid
   hand-maintained counts and version numbers.

## Update order

1. Correct version, counts, TypeScript version, Extract route, PWA wording,
   storage/privacy wording, and rendering claim.
2. Change the primary link to `#apply` and add outcome-oriented hero paths.
3. Replace absolute test and renderer-parity claims with evidence-scoped copy.
4. Reduce duplicate long-form feature claims. Link to the live Reference tab,
   release notes, research, and source for details.
5. Add a release truth check that compares the public page with the application
   package version, capability count, public-skill count, and privacy wording.

## Scope boundary

This review does not modify the OverKill Hill repository or the Replit project.
The public source is in a separate repository and should be updated there only
with a dedicated, evidence-backed change.
