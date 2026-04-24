# Theme Metadata Schema

Each palette in Mermaid Theme Builder follows a structured metadata schema. This document describes every field.

---

## TypeScript interface

```typescript
export interface ThemeColor {
  key: string;      // Mermaid themeVariable key (e.g. "primaryColor")
  label: string;    // Human-readable label shown in the UI
  value: string;    // CSS color value or font-family string
}

export interface PaletteAttribution {
  enabledByDefault: boolean;  // Whether attribution is on by default
  label: string;              // Badge/footnote display text
  url: string;                // Tool URL for clickable attribution
  themeName: string;          // Theme display name for attribution text
  toolName: string;           // Tool name ("Mermaid Theme Builder")
  toolVersion: string;        // Semantic version ("0.1.0")
}

export interface Palette {
  id: string;               // Canonical slug (e.g. "overkill-hill")
  name: string;             // Display name (e.g. "OverKill Hill P³")
  brandFamily?: "okhp3";    // "okhp3" for OKHP3 ecosystem presets
  isBrandPreset?: boolean;  // true = shown in Brand Presets section
  description: string;      // Short description shown in color editor
  themeIntent?: string;     // Comma-separated use-case guidance
  sourceUrls?: string[];    // Brand source URLs (sites + GitHub CSS)
  version: string;          // Semantic version string ("0.1.0")
  colors: ThemeColor[];     // 13 Mermaid themeVariable entries
  attribution: PaletteAttribution;
}
```

---

## Field reference

### `id`
A lowercase kebab-case string used as the canonical identifier. Used in metadata comments and export filenames. Brand preset IDs should match the brand slug: `overkill-hill`, `askjamie`, `glee-fully`.

### `name`
The human-readable display name shown in the UI and exports. Brand preset names use the exact official brand name: `OverKill Hill P³`, `AskJamie`, `Glee-fully`.

### `brandFamily`
Optional. Set to `"okhp3"` for all palettes that belong to the OverKill Hill P³ design ecosystem. Absent for generic/community palettes.

### `isBrandPreset`
If `true`, the palette appears in the **Brand Presets** section of the UI, separated from generic **Theme Presets**.

### `description`
A one-to-two sentence description of the palette's visual character, sourcing, and intended use. Shown in the color editor below the section header.

### `themeIntent`
A comma-separated list of diagram use cases this palette is optimized for. Shown in the Theme Details panel and included in Prompt Scaffold exports.

### `sourceUrls`
An array of URLs where the brand's CSS/design source is publicly available. The first URL is used as the primary brand source in exports. Should include both the live site URL and the GitHub CSS source URL.

### `version`
Semantic version string. Incremented when palette colors or metadata change meaningfully. Used in metadata comments and Markdown Bootstrap exports.

### `colors`
An array of 13 `ThemeColor` objects mapping to Mermaid's `themeVariables` object. The standard 13 keys:

| Key | Role |
|---|---|
| `primaryColor` | Default node background |
| `primaryTextColor` | Default node text |
| `primaryBorderColor` | Default node border |
| `lineColor` | Arrow and edge color |
| `secondaryColor` | Secondary node background |
| `tertiaryColor` | Tertiary node background |
| `background` | Diagram background |
| `mainBkg` | Main diagram area background |
| `nodeBorder` | Node border (some diagram types) |
| `clusterBkg` | Subgraph/cluster background |
| `titleColor` | Diagram title text color |
| `edgeLabelBackground` | Background behind edge labels |
| `fontFamily` | Font family string (not a color) |

### `attribution`
Default attribution metadata for the palette. The app reads `attribution.enabledByDefault` to pre-populate the "Metadata comments" toggle. The `label`, `url`, `themeName`, `toolName`, and `toolVersion` are used when generating attribution text in exports.

---

## Custom theme metadata

When a user modifies a palette's colors via the Color Editor, the UI treats it as a customized palette. Custom palettes:

- Retain their base palette's `id`, `version`, and `attribution` metadata
- Show a blue dot indicator in the palette picker
- Can be given a custom name via the **Theme name** input in Export Settings
- If no custom name is set, exports use `Custom — based on [Base Palette Name]`
- The "Reset" button in the Color Editor reverts all color overrides and clears the custom name

Custom themes are held in React state only. They are not persisted between sessions.

---

## Backward compatibility

The app applies safe defaults for any palette missing optional fields:

- `isBrandPreset` absent → treated as `false` (utility preset)
- `brandFamily` absent → not displayed in Theme Details
- `themeIntent` absent → Theme Details panel is not shown
- `sourceUrls` absent → source link is not shown
- `attribution` absent → attribution defaults to tool name + URL only
