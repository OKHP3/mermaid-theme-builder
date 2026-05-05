# Render Safety Checklist — Mermaid Theme Builder

This checklist covers known Mermaid rendering pitfalls and how Mermaid Theme Builder handles them. Apply this when reviewing new exports, updating the theme engine, or adding new diagram type support.

---

## 1. Init directive conflicts

**Risk:** User pasted code already contains a `%%{init:...}%%` block. Applying a new theme overwrites it without warning.

**Current mitigation:**
- `detector.ts` detects existing init directives via regex
- A yellow warning banner is shown: "Existing %%{init:...}%% directive detected — applying this theme will replace it."

**Checklist:**
- [ ] Warning shown when input contains `%%{init`
- [ ] Exported code does not contain two `%%{init}%%` blocks
- [ ] Existing init block is cleanly replaced, not prepended alongside the old one

---

## 2. Non-printable characters

**Risk:** Non-printable characters (control codes U+0000–U+001F, except newline) in diagram code cause silent Mermaid render failures.

**Current mitigation:**
- `detector.ts` scans for non-printable chars and issues a warning

**Checklist:**
- [ ] Warning shown for non-printable characters
- [ ] Exported code does not re-introduce non-printable chars through theme injection

---

## 3. Long labels

**Risk:** Labels longer than 200 characters cause Mermaid layout issues, including text overflow and broken node sizing.

**Current mitigation:**
- `detector.ts` detects any line over 200 characters and warns

**Checklist:**
- [ ] Warning shown for lines > 200 chars
- [ ] Theme injection does not add lines longer than 200 chars

---

## 4. Attribution badge injection (flowchart only)

**Risk:** Injecting a badge node into non-flowchart diagrams breaks Mermaid syntax entirely.

**Current mitigation:**
- Badge injection is gated to `DiagramFamily === "flowchart"`
- Toggle is disabled in the UI for all other diagram types

**Checklist:**
- [ ] Badge node is only injected when `family === "flowchart"`
- [ ] Injected badge uses valid flowchart node syntax
- [ ] Badge injection does not duplicate or conflict with existing node IDs
- [ ] If a link is injected with `click`, a warning about `securityLevel: loose` is shown

---

## 5. `%%{init}%%` JSON validity

**Risk:** Malformed JSON in the `%%{init}%%` block causes Mermaid to fall back to the default theme silently.

**Current mitigation:**
- `themeEngine.ts` uses `JSON.stringify` to build the init block — no manual string interpolation of the JSON payload

**Checklist:**
- [ ] Generated `%%{init}%%` block is valid JSON
- [ ] Color values containing quotes are escaped correctly
- [ ] `JSON.stringify(initBlock)` is used, not string concatenation

---

## 6. `securityLevel` warning for clickable attribution

**Risk:** Clickable node links (using Mermaid's `click` syntax) require `securityLevel: "loose"` and do not work in many Mermaid renderers.

**Current mitigation:**
- Attribution badge link is not injected by default
- If badge is enabled, the generated code uses a labeled node only (no `click` directive in V1)
- Documentation notes the `securityLevel: loose` requirement

**Checklist:**
- [ ] Default badge: labeled node, no `click` directive
- [ ] If `click` is ever added: warning shown to user about renderer compatibility

---

## 7. Theme variable key correctness

**Risk:** Using incorrect Mermaid `themeVariables` keys (e.g. wrong case, deprecated names) causes silently ignored theme values.

**Current mitigation:**
- Palette color keys are validated against a known set in the palette schema
- `DIAGRAM_CAPABILITIES` notes which types support themeVariables reliably

**Checklist:**
- [ ] All palette color `key` fields use valid Mermaid themeVariable names
- [ ] No deprecated or removed themeVariable names used in built-in palettes
- [ ] On Mermaid upgrade, review themeVariables changelog for removed/renamed keys

---

## 8. Mermaid version mismatch

**Risk:** Capability registry claims support (or lack of it) for a diagram type that has changed in a new Mermaid version.

**Current mitigation:**
- `MERMAID_VERSION_VERIFIED` in `src/data/mermaid-capabilities.ts` records the last reviewed version
- Release checklist requires updating the registry after each Mermaid upgrade

**Checklist:**
- [ ] `MERMAID_VERSION_VERIFIED` matches the Mermaid version in `package.json`
- [ ] `DEPENDENCY_GOVERNANCE.lastCapabilityRegistryUpdate` updated after registry changes
- [ ] New diagram types in the Mermaid release added to registry
- [ ] Promoted (beta → stable) types have their `stability` and `supportStatus` updated
- [ ] `themeConfidence` re-evaluated for any type whose renderer changed

---

## 12. Capability registry gap overclaiming

**Risk:** A gap entry in `CAPABILITY_GAPS` is interpreted as a claim that the app implements that notation (e.g., BPMN 2.0). This could mislead users or imply features that don't exist.

**Current mitigation:**
- Gap entries are displayed in a separate "Capability Gaps" section in the Diagram Inventory
- The inventory footer includes an explicit disclaimer: "Mermaid Theme Builder does not implement unsupported formal notations. Gaps are tracked for honest reference only."
- All gap entries have `supportStatus` of `"gap"`, `"emulatable"`, or `"external"` — never `"native"` or `"partial"`
- Gap entries carry an explicit `warning` field describing the limitation
- `exampleFile: null` and `examplePending: true` on all gap entries (until a verified approximation is documented)

**Checklist:**
- [ ] No gap entry has `supportStatus: "native"` or `"partial"`
- [ ] Every gap entry has a non-empty `warning` field
- [ ] Inventory UI clearly separates "Mermaid Families" from "Capability Gaps"
- [ ] Inventory footer disclaimer is present and accurate
- [ ] No gap entry's `approximatedBy` field points to a family that doesn't exist in `DIAGRAM_CAPABILITIES`

---

## 13. Detection false positives for new diagram types

**Risk:** New diagram types (ZenUML, Radar, Wardley, TreeView) use declaration keywords that could false-match other content if the regex is too broad.

**Current mitigation:**
- All declaration regexes use `\b` word boundaries and `^` line anchors with `im` flags
- Regex patterns are tested in the context of realistic Mermaid input

**Checklist:**
- [ ] Each new diagram type declaration regex uses `^\s*<keyword>\b` with `im` flags
- [ ] No declaration regex matches on arbitrary word boundaries within a longer block
- [ ] Detection order in `DIAGRAM_CAPABILITIES` places more specific patterns before general ones

---

## 9. Empty or whitespace-only input

**Risk:** Empty input passed to Mermaid renders nothing, or throws.

**Current mitigation:**
- `detector.ts` returns `family: "unknown"` for empty input
- Theme application is blocked when family is unknown

**Checklist:**
- [ ] Empty input does not crash the preview
- [ ] "Unknown" state is gracefully handled in the UI
- [ ] Export buttons produce meaningful output or show an appropriate message

---

## 10. YAML frontmatter conflicts

**Risk:** User pasted code contains a YAML `---` frontmatter block with `config:` settings (layout, theme, etc.). Applying a palette theme injects a `%%{init}%%` directive that conflicts with or overrides the frontmatter, potentially in unpredictable ways depending on Mermaid version.

**Current mitigation:**
- `detector.ts` detects YAML frontmatter via regex and adds a warning
- `generateThemedCode` strips the YAML frontmatter block before applying the palette theme
- The "Showcase" sample (which uses ELK layout frontmatter) displays an explicit compatibility note in the UI

**Checklist:**
- [ ] Warning shown when input starts with `---\n`
- [ ] YAML frontmatter is fully stripped in exported code
- [ ] Stripped code renders without leftover `---` lines
- [ ] Showcase compatibility note appears when `layout: elk` is detected in frontmatter

---

## 11. Metadata comment injection

**Risk:** Metadata comment lines inject characters that break the Mermaid parser.

**Current mitigation:**
- Metadata is injected as `%% comment` lines which are valid Mermaid comment syntax
- Line content uses only printable ASCII

**Checklist:**
- [ ] All metadata comment lines use `%% ` prefix
- [ ] No metadata value contains characters that break the `%% comment` syntax (e.g. `%%` inside a comment value)
- [ ] Theme name from user input is sanitized before injection into comments
