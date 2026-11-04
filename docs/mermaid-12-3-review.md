# Mermaid 12.3 compatibility review

Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill.
It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
Mermaid.ai, or any third-party brand represented by user-entered colors.

Reviewed November 4, 2026 for application version 0.11.0. A source pin and this
review do not establish deployment. Required checks, Replit acceptance, the
release tag, Pages deployment, and the live revision are separate gates.

## Vendor and installation boundary

[Mermaid 12.3.0](https://github.com/mermaid-js/mermaid/releases/tag/mermaid@12.3.0)
is a non-prerelease, non-draft vendor release. The official npm registry reports
`latest=12.3.0`, publication at `2026-11-03T13:18:31.144Z`, MIT licensing, and an
unchanged Node floor of 22.12.0. The committed integrity matches the registry's
SHA-512 value. Registry provenance metadata is present; this is not a separate
cryptographic attestation verification claim.

The installer minimum age of 1,440 minutes was satisfied before installation.
The owner explicitly approved a one-time manually reviewed release before the
automatic proposal cooldown ends November 6 at 13:18:31.144 UTC. Neither policy
is lowered, excluded, or removed. Future proposals still wait three days and
require compatibility review plus the four protected checks.

## Compatibility decisions

| Area | Decision and coverage |
| --- | --- |
| Existing themes | No storage, migration, palette, typography, or share schema changes. Retain legacy `mtb.state.v1` and additive `mtb.state.v2` behavior. |
| Existing output | Preserve Classic/Dagre defaults, renderer destinations, class definitions, Markdown, and prompt scaffolds. Export snapshot changes are limited to the Mermaid version metadata. |
| New flowchart capabilities | Verify adjacent edge IDs, BPMN element shapes, ordered animation, and reduced-motion behavior through the actual strict-security preview. No new controls or inferred cross-renderer support. |
| Formal BPMN | Element shapes are not a native BPMN family, execution semantics, or XML interchange. Keep the BPMN capability gap and clarify its warning. |
| ELK | Exercise the vendor layout in Original mode, then return to the existing themed Dagre output. Do not silently replace the default layout. |
| Family inventory | No newly registered or promoted family is claimed from this minor release. The existing beta and experimental labels remain. The vendor's agentflow patch is not a claim of Builder-specific agentflow styling guidance. |
| Input compatibility | Vendor edge IDs now reject bracket, brace, parenthesis, and pipe characters. Preserve user source; do not silently rename identifiers. Invalid source continues to use the existing visible render-error path. |

The new animation tests check actual SVG motion elements and computed
reduced-motion visibility. A rejected-edge test confirms source preservation,
visible errors, and recovery after an explicit correction. The expanded migration suite also retains flowchart,
class, state, ER, requirement, use case, ZenUML, mindmap, and circle-label checks.
CI runs this suite against production and development builds. Existing full
browser coverage checks saved themes, imports, exports, cross-diagram previews,
responsive behavior, and warmed offline recovery.

Primary implementation references:
[edge IDs](https://github.com/mermaid-js/mermaid/pull/8459),
[BPMN shapes](https://github.com/mermaid-js/mermaid/pull/8165),
[step animation](https://github.com/mermaid-js/mermaid/pull/8470), and
[ELK update](https://github.com/mermaid-js/mermaid/pull/8532).

## Dependency and license review

The lockfile diff changes Mermaid 12.2.0 to 12.3.0, resolves the vendor's new ELK
range to 0.12.1, updates the existing ZenUML peer binding, and removes unused
uuid 11.1.1. All other resolved package versions stay unchanged. DOMPurify
remains 3.4.17, already selected by the repository's security override.
ZenUML remains 1.0.1. The separate Workbench consumes no direct Mermaid pin.

[ELK 0.12.1 metadata](https://registry.npmjs.org/elkjs/0.12.1) declares
`EPL-2.0 OR GPL-3.0-or-later`; its earlier version declared EPL-2.0. The existing
EPL option remains available. This update does not relicense the application,
modify vendor source, or select a GPL-only dependency. Preserve upstream
notices and source references. This recorded metadata review is not legal
certification or a claim that a vulnerability scan checks license obligations.

Issue #98's embedded ZenUML distribution review is separate and remains open.
Issue #83 tracks other foundational updates and is not closed by this upgrade.

## Release acceptance

Before merge: successive frozen script-disabled installs, dependency audit,
typechecks, formatting and source/document guards, unit and Workbench tests,
both builds, skill tests, full production browser tests, development renderer
tests, and Replit Free preview acceptance. Main must be current and all four
required checks successful at the exact reviewed head. No protection bypass.

After merge: verify main CI and Pages, create the annotated version tag and
release, inspect the live build, and fast-forward clean local/Replit checkouts.
Review and gate any release-generated screenshot PR separately. Retained
execution receipts belong in the existing technology-maintenance artifact home.
