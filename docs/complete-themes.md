# Complete themes and local recovery

Increment 2 (v0.9.0). Owner approval for gated merge and release was received on
2026-11-04. Verify the release tag and Pages run for deployment status.

Mermaid Theme Builder is a personal OverKill Hill P3 project by Jamie Hill.
It is not affiliated with Builders FirstSource, BFS, Mermaid, Mermaid Chart,
Mermaid.ai, or any third-party brand represented by user-entered colors.

## Save once, reuse across diagrams

A complete theme records its name, colors, look, font size, five typography
tiers, stroke width, destination, output format and override policy, comments,
badge preference, palette metadata, and provenance. The three supported
advanced renderer settings remain supported. Unknown advanced settings and
semantic definitions are retained as inert data, not executed or advertised as
new rendering capabilities. Renderer limitations still apply.

- Save theme creates a personal theme from a built-in starting palette.
- Save changes replaces only the selected named theme after a verified write.
- Save as copy creates a new identifier and independent nested settings.
- Edits automatically recover as drafts, not silent changes to named themes.
- A dirty theme switch requires Save, Keep draft, Discard, or Cancel.
- Search, rename, duplicate, reorder, and confirmed delete work beyond three
  themes. Browser storage capacity still limits the collection.

Theme changes do not modify the editor's diagram source. Selecting a new example
or explicitly loading extracted code retains its existing source-changing role.

## Files and links

Complete themes use `mtb-governance-profile` schema 3. Profile v2, palette JSON,
palette bundles, and legacy `theme` links remain readable. Imports show a review
dialog and default to copies; they do not activate a theme or replace source.
An explicit profile-details replacement requires its own confirmation. Legacy
palette links retain their existing behavior of opening an unsaved working
draft; they never overwrite a named saved theme or the editor source.

Library JSON uses `mtb-theme-library` schema 1. It includes saved themes only,
not drafts, editor source, or the legacy snapshot. Restore it in an empty browser
to recover the collection, or import as copies into an existing collection.
Complete-theme links embed the data in the URL, visible to recipients and browser
history. The application caps links at 32,000 characters and directs larger
themes to JSON. A platform may impose a smaller URL limit.

The separately labeled legacy palette export omits non-color settings. Do not
use it as a complete-theme backup. Future schemas are rejected without writes;
retain the original file for a compatible application.

## Storage and migration

`src/lib/theme-library.ts` owns the `mtb.state.v2` envelope. It separates saved
themes, drafts, ordering, editor session, and migration provenance. The previous
`mtb.state.v1` value is never rewritten or removed by this increment. Migration
retains its exact bytes and an ID mapping, including collision resolution.
All recoverable legacy slots, palettes, customized presets, unknown metadata,
and source text are accounted for. Missing settings are disclosed, not invented
as historical facts. Only the active draft receives formerly global controls.

`src/hooks/useThemeLibrary.ts` serializes writes within a tab and uses the
browser's Web Locks API across tabs. Inside the lock it compares the revision
and original legacy bytes, validates the full candidate, writes one envelope,
and verifies the saved bytes. Missing locks, quota/security errors, malformed
records, and newer schemas stop canonical writes and never report success.

If another tab or an older application changes storage, the current tab stops
writing the shared library. Its work remains in memory and, when storage allows,
under a separate `mtb.recovery.*` key. Download workspace recovery before reloading.
The application does not merge conflicting edits automatically.

## Recovery and rollback

1. Keep the affected tab open when a storage warning appears.
2. Download workspace recovery. This explicitly contains current drafts,
   diagram text, and retained raw browser data. Treat it as private.
3. Download the saved-theme library separately when available.
4. Restore library JSON in a clean browser running a compatible build. Verify
   names, counts, settings, and source separation before retiring the original.

Workspace recovery is a diagnostic recovery package, not a library import. A
compatible recovery build can validate its workspace envelope and restore it
to an isolated browser before any manual reconciliation. Do not replace the
original browser data with an unvalidated recovery file.

Returning to v0.8.0 reads only the original snapshot. It cannot represent new
complete fields or extra themes. Export newer work first; a downgrade is not
lossless. Returning to this compatible build reads the new envelope again,
unless the legacy app changed the old snapshot, in which case saves stop for
reconciliation. No cleanup of old keys is part of Increment 2.

## Verification boundaries

Unit tests cover conversion, round trips, isolation, malformed/future records,
write failures, and concurrent revisions. Browser tests cover save/switch/reload,
fourth-theme search, multiple diagram families, legacy lifecycle controls,
portable library restoration, storage warnings, real two-tab conflicts, and
keyboard/mobile accessibility. Test results and the Replit Free review preview
are recorded separately from source. No test result alone proves deployment.
