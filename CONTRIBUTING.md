# Contributing to Mermaid Theme Builder

## Scope Firewall

This is a fully static, browser-only visual governance utility. No pull request will be accepted that adds:

- A backend server, API, or database
- User login or authentication
- AI API calls or LLM inference
- Third-party brand themes (BFS, Walmart, Apple, Microsoft, etc.)
- Any reference to an employer, workplace, or client project

Built-in palettes must be original generic palettes or OverKill Hill P³ ecosystem palettes only. See `AGENTS.md` for the full brand firewall and `src/lib/palettes.ts` for approved palette definitions.

## How to Run Locally

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/OKHP3/mermaid-theme-builder.git
   cd mermaid-theme-builder
   pnpm install
   ```

2. Start the dev server (requires `PORT` and `BASE_PATH` env vars — the Replit workflow sets these automatically):
   ```bash
   pnpm dev
   ```

3. Run the TypeScript check:
   ```bash
   pnpm run typecheck
   ```

## How to Add a Palette

1. Open `src/lib/palettes.ts`.
2. Copy an existing palette object from `BUILTIN_PALETTES` as a template.
3. Give it a unique `id`, `name`, and `description`. Choose a generic or OKHP³ ecosystem theme — no third-party brands.
4. Fill in the `colors` array with your `ThemeColor` entries (keys must match the canonical schema).
5. Add your palette to the `BUILTIN_PALETTES` export array.
6. Verify it renders correctly in the Apply tab preview.

## How to Add an Example

1. Author your `.mmd` file in the `examples/` directory as a human-readable reference.
2. Open `src/data/example-library.ts`.
3. Add an entry to `EXAMPLE_CATALOG` with `id`, `title`, `family`, `content` (inline the `.mmd` text), and `paletteId`.
4. Place it in the appropriate `EXAMPLE_GROUPS` group, or create a new group if needed.
5. The example will appear in the Examples tab automatically.

## AI Contributor Rules

If you are an AI agent or automated tool, read `AGENTS.md` before making any changes. It contains the brand firewall, architecture constraints, diagram detection rules, export rules, and the canonical disclaimer that must appear in all major documentation.

## What We Accept

- Bug fixes
- New generic palette presets
- New example diagrams (all families welcome)
- Accessibility improvements
- Documentation improvements

## What We Do Not Accept

- Server-side features
- Third-party brand presets
- AI API integrations
- Payment processing or cloud storage

## License

MIT. All contributions are under the same license. See `LICENSE`.
