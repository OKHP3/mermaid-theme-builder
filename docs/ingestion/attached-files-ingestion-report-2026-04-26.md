# Attached Files Ingestion Report — 2026-04-26

## Purpose

This report evaluates the uploaded files for placement inside `OKHP3/mermaid-theme-builder` and documents the firewall decision before project content is incorporated.

## Firewall Decision

Several uploaded artifacts contain legacy employer-brand material. Those materials must not be imported verbatim into the repository.

Permitted import pattern:

- sanitize legacy planning docs before archive storage;
- normalize old `Style Builder` / `Style Composer` language to `Theme Builder` where appropriate;
- exclude any employer-owned palette payloads;
- store ZIP contents only after decompression;
- do not store ZIP files themselves;
- do not add employer-specific color values, palette names, examples, screenshots, workflows, or brand references;
- do not add third-party corporate preset themes.

## Uploaded Files Reviewed

| Uploaded source | Evaluation | Recommended repo destination | Import status |
|---|---|---|---|
| `BUILD_SPEC.md` | Useful legacy build specification, but outdated and contains employer-palette references. | `docs/archive/planning/legacy-build-spec-v0-1-sanitized.md` | Sanitize before import. |
| `PRD.md` | Useful legacy PRD, but contains outdated product name/repo paths and employer-palette references. | `docs/archive/planning/legacy-prd-v0-1-sanitized.md` | Sanitize before import. |
| `README.md` | Legacy README; should not replace the current root README. Contains outdated naming and employer-palette reference. | `docs/archive/planning/legacy-readme-v0-1-sanitized.md` | Sanitize before import. |
| `mermaid-style-builder-positioning.md` | High-value positioning material. Product naming should be normalized to Mermaid Theme Builder. | `docs/positioning/mermaid-theme-builder-positioning.md` | Safe after naming normalization. |
| `mermaid-example-library.md` | High-value source document for the example library. Contains a few employer-firewall references that should be generalized. | `docs/examples/mermaid-example-library.md` | Sanitize before import. |
| `overkill-content-machine.md` | Strong showcase artifact; should be preserved as both narrative markdown and extracted `.mmd`. | `examples/showcase/overkill-content-machine.md` and `examples/showcase/overkill-content-machine.mmd` | Safe after scan. |
| `replit-reorientation-prompt.md` | Useful historical implementation prompt. Contains explicit employer-firewall language and protected values. | `docs/prompts/replit-reorientation-prompt-sanitized.md` | Sanitize before import. |
| `replit-v02-sprint-prompt.md` | Useful V0.2 sprint prompt. Contains explicit employer-firewall language and protected values. | `docs/prompts/replit-v0-2-alpha-sprint-prompt-sanitized.md` | Sanitize before import. |
| `mermaid_theme_builder_overkill_examples_v0_1.zip` | Valid OverKill example pack. ZIP should not be committed; decompressed `.mmd` files should be stored. | `examples/overkill-pack/` | Import decompressed contents. |
| `mermaid_style_composer_seed_packet_v0_1.zip` | Legacy seed packet. Contains employer-owned palette material and legacy naming. | `docs/archive/seed-packet-v0-1/` | Import only sanitized non-palette contents; exclude employer-owned palette. |
| `mermaid_style_composer_packet/` | Duplicate/extracted variant of the seed packet. | Do not duplicate; reference seed-packet archive. | Do not separately import. |

## Excluded Content

The legacy seed packet contains an employer-owned palette payload that must remain excluded.

Reason: it contains employer-owned palette naming and protected brand color values.

## Recommended Repository Structure

```text
docs/
  archive/
    planning/
      legacy-build-spec-v0-1-sanitized.md
      legacy-prd-v0-1-sanitized.md
      legacy-readme-v0-1-sanitized.md
    seed-packet-v0-1/
      legacy-theme-builder-prd-build-packet-v0-1-sanitized.md
      legacy-readme-v0-1.md
      legacy-agents-v0-1.md
      legacy-replit-build-brief-v0-1-sanitized.md
      standards/
      examples/
      palettes/neutral-enterprise.json
      github-templates/
  examples/
    mermaid-example-library.md
  ingestion/
    attached-files-ingestion-report-2026-04-26.md
  positioning/
    mermaid-theme-builder-positioning.md
  prompts/
    replit-reorientation-prompt-sanitized.md
    replit-v0-2-alpha-sprint-prompt-sanitized.md

examples/
  overkill-pack/
  showcase/
    overkill-content-machine.md
    overkill-content-machine.mmd
```

## Follow-Up Work Required

1. Import sanitized legacy docs into the paths above.
2. Decompress the OverKill example pack into `examples/overkill-pack/`.
3. Extract the Mermaid block from `overkill-content-machine.md` into `examples/showcase/overkill-content-machine.mmd`.
4. Import only sanitized non-palette contents from the legacy seed packet.
5. Exclude the employer-owned palette payload.
6. Run a final repository scan for employer identifiers and protected values after import.
7. Wire imported examples into the Diagram Inventory / Capability Registry.

## Final Import Rule

No imported file should contain employer identifiers, employer-owned palette names, or employer-owned color values. If a legacy artifact is historically useful but contaminated, it must be sanitized before archive storage.