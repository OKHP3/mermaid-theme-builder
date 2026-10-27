# Dependency and workspace review: 2026-09-20

The public application remains the root Vite app. The retained `artifacts/mermaid-theme-workbench` scaffold is not the deployed application; its component wrappers now participate in typechecking and regression tests so dependency updates cannot silently break them.

## Integrated updates

- Security patches: DOMPurify 3.4.15, Vitest 4.1.11, and a scoped postcss-selector-parser 6.1.4 resolution (minimum 6.1.3 override) for the ZenUML/Tailwind 3 chain. No release-age or runtime security control is relaxed.
- React 19.3, Vite 8.3, Tailwind 4.3.3, compatible maintenance packages, and current Actions major channels.
- Mermaid 11.17.2 with an exact pin and matching capability registry. Existing family rendering, exports, and theme isolation remain release gates.
- Scaffold-only date-fns 4, DayPicker 10, Recharts 3, and resizable panels 4. DayPicker uses the supported `month_grid` class key. Recharts uses content payload types. Panels use Group/Separator and orientation-aware styling, with explicit percentage sizes in tests.
- Restore missing Apply workspace class definitions using existing Forge tokens. Desktop columns become a stacked, scrollable mobile layout. The previous screenshot proposal exposed this defect and is superseded by the repaired release capture.

## Reviewed deferrals

| Candidate | Decision and required follow-up |
| --- | --- |
| Mermaid 12 and ZenUML 1 | Coordinate as one renderer migration. ZenUML 1 depends on Mermaid 12, which changes default layouts and themes and raises the browser floor. Retain exact ZenUML 0.2.3 alongside Mermaid 11.17.2. Major-update automation is excluded for both packages, while the technology audit continues to report them. |
| Vitest 5 | Retain the validated Vitest 4 suite until a dedicated major test-runner migration is reviewed. |
| Prettier 3.9.8 | The installed 3.9.6 remains within the supported range; retain the release-age-filtered lockfile and let the maintenance group propose the patch after its cooldown. |
| pnpm 12 | Retain the tested pnpm 10.26.1 lockfile and installation contract until a separate package-manager migration verifies overrides, release-age protection, and all hosts. |
| Replit Nix channel and Python | Latest upstream releases do not prove availability in this Replit environment. Keep declared host versions until the hosted environment can be validated. |
| Scaffold hookform/resolvers 5 | Defer this unproposed major migration; no current scaffold route uses a resolver. Validate form schemas and error behavior before adopting it. |
| date-fns-jalali prerelease | No stable upstream release is published; this is an audit fact rather than an instruction to replace or remove the dependency. |

## Sources

- [Mermaid 11.17 changes](https://github.com/mermaid-js/mermaid/releases/tag/mermaid@11.17.0)
- [ZenUML 1 requirements](https://github.com/mermaid-js/mermaid/releases/tag/@mermaid-js%2Fmermaid-zenuml@1.0.0)
- [DayPicker 10 migration](https://daypicker.dev/upgrading)
- [Recharts 3 migration](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- [Resizable panels migration](https://github.com/bvaughn/react-resizable-panels/blob/main/CHANGELOG.md)

Validation evidence is recorded in the integration pull request and its exact-commit checks. No change to diagram-content privacy, trust boundaries, or protected-main checks is part of this maintenance release.

## Bundled-code evidence boundary

The package audit reports zero advisories after the patches above. That report does not inspect copies embedded in upstream distribution bundles. Vite now uses the official Mermaid and ZenUML core entry points so Mermaid resolves its patched external DOMPurify dependency instead of its prebundled 3.4.12 copy.

The retained `@zenuml/core` 3.49.0 bundle still embeds DOMPurify 3.3.1. Inspection of upstream 3.50.1 and 4.3.0 distributions found the same embedded version, so a major bump would not resolve this finding. The application retains Mermaid strict security mode and its native ZenUML SVG path. No claim is made that package-audit zero proves this embedded copy safe or unreachable. [Upstream remediation or an independently reviewed isolation change remains tracked in issue #98](https://github.com/OKHP3/mermaid-theme-builder/issues/98); do not copy or rewrite the vendor bundle to hide the version.
