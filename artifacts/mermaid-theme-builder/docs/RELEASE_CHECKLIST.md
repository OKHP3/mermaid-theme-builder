# Release Checklist — Mermaid Theme Builder

Use this checklist before tagging and deploying any release.

---

## Pre-release: brand firewall

- [ ] Search codebase for `BFS`, `Builders FirstSource`, `BuildersFirstSource`, `BFS Light`, `Builders Blue`, `FirstSource`, `employer`, `daytime employer` — none found
- [ ] Search for `Walmart`, `Starbucks`, `Apple Theme`, `Microsoft Theme`, `Target Theme`, `Home Depot Theme` — none found
- [ ] Canonical disclaimer present in README and major docs
- [ ] No real-company brand presets in palette list

---

## Pre-release: Mermaid dependency

- [ ] `mermaid` version in `package.json` is the intended pinned version
- [ ] `pnpm-lock.yaml` is up to date (run `pnpm install` to confirm)
- [ ] `MERMAID_VERSION_VERIFIED` in `src/data/mermaid-capabilities.ts` matches installed Mermaid version
- [ ] Capability registry reviewed against Mermaid release notes for this version
- [ ] Any new or promoted diagram types added to the registry
- [ ] `docs/MERMAID_CAPABILITY_REGISTRY.md` table updated to match

---

## Pre-release: functionality

Run the following manual test scenarios:

### Test A — Flowchart (full theme support)
- [ ] Paste a flowchart diagram
- [ ] Header chip shows "Flowchart"
- [ ] No blue capability note appears
- [ ] Select a brand preset — preview updates
- [ ] Click "Styled Code" — valid `%%{init}%%` Mermaid code copied
- [ ] Click "Markdown" — Markdown block with metadata copied
- [ ] Click "Prompt Scaffold" — prompt with style rules copied
- [ ] Toggle metadata comments off — metadata block absent from output
- [ ] Toggle attribution badge on — badge node appended to diagram
- [ ] Attribution badge toggle off — badge removed from diagram

### Test B — Sequence diagram (partial support)
- [ ] Paste a `sequenceDiagram`
- [ ] Header chip shows "Sequence Diagram"
- [ ] Blue capability note appears with "Partial theme support" and "Stable" badge
- [ ] Attribution badge toggle is disabled

### Test C — Gantt (limited support)
- [ ] Paste a `gantt` diagram
- [ ] Header chip shows "Gantt Chart"
- [ ] Blue capability note appears with "Limited theme support"

### Test D — Unknown input
- [ ] Clear input and type random text
- [ ] Yellow warning: "Could not detect diagram type"
- [ ] No blue capability note
- [ ] Export buttons remain accessible

### Test E — Brand presets
- [ ] OverKill Hill P³ preset loads and renders visually
- [ ] AskJamie preset loads and renders visually
- [ ] Glee-fully preset loads and renders visually
- [ ] Each utility preset (Ocean Depth, Forest Sage, Slate Ember, Violet Mist) loads correctly

### Test F2 — Example library
- [ ] "Load example ▾" dropdown opens for all brand and utility palettes
- [ ] Brand palettes: Flowchart and Sequence options load correct palette-matched examples
- [ ] Utility palettes: Generic option loads the basic flowchart sample
- [ ] All palettes: "Rube Goldberg Showcase" option appears below a separator
- [ ] Loading Showcase: YAML frontmatter warning appears in the input pane
- [ ] Loading Showcase: "Advanced" badge is visible on the menu item
- [ ] Applying a theme to the Showcase strips the YAML frontmatter and renders the flowchart with the selected palette's %%{init}%% applied
- [ ] Showcase renders or fails gracefully with an actionable Mermaid error

### Test F — Original vs Themed preview
- [ ] "Original" tab shows unstyled Mermaid diagram
- [ ] "Themed" tab shows diagram with applied theme colors

---

## Pre-release: documentation

- [ ] README.md reflects current feature list
- [ ] ROADMAP.md updated with released / deferred items
- [ ] docs/MERMAID_CAPABILITY_REGISTRY.md version tag updated
- [ ] AGENTS.md current

---

## Pre-release: build

- [ ] `pnpm --filter @workspace/mermaid-theme-builder run build` succeeds with no TypeScript errors
- [ ] No console errors in browser on fresh load
- [ ] Production build renders the default example correctly

---

## Release: tag and deploy

- [ ] Create a git tag: `git tag v{major}.{minor}.{patch}`
- [ ] Push tag to GitHub: `git push origin v{major}.{minor}.{patch}`
- [ ] Deploy build to hosting target
- [ ] Verify health check (see `docs/DEPLOYMENT.md`)

---

## Post-release

- [ ] Update `TOOL_VERSION` in `src/lib/themeEngine.ts` if version changed
- [ ] Note the release in ROADMAP.md under completed milestones
- [ ] Confirm Dependabot is active (`.github/dependabot.yml`)
