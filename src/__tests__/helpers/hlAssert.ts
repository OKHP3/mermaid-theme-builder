/**
 * Thin assertion helpers for HighlightedCode / ClassBrowser color assertions.
 *
 * These make test intent obvious at a glance and prevent new tests from
 * reverting to raw hex strings. A single place to update if the assertion
 * pattern changes (e.g. switching from inline style to CSS class).
 *
 * Import palette:
 *   - HL        — classDef syntax colors: keyword, name, key, hex, value, punct
 *   - INIT_HL   — %%{init}%% directive colors: bracket, content
 *   - COMMENT_HL — %% comment color: text
 *
 * Usage:
 *   import { expectKeywordColor, expectNoKeywordColor } from "./helpers/hlAssert";
 *   expectKeywordColor(html);     // same as: expect(html).toContain(`color:${HL.keyword}`)
 *   expectNoKeywordColor(html);   // same as: expect(html).not.toContain(`color:${HL.keyword}`)
 */

import { expect } from "vitest";
import { HL, INIT_HL, COMMENT_HL } from "@/components/HighlightedCode";

// ── classDef / ClassBrowser — keyword ────────────────────────────────────────

/** Asserts the HTML contains the classDef keyword color (rust-orange). */
export function expectKeywordColor(html: string): void {
  expect(html).toContain(`color:${HL.keyword}`);
}

/** Asserts the HTML does NOT contain the classDef keyword color. */
export function expectNoKeywordColor(html: string): void {
  expect(html).not.toContain(`color:${HL.keyword}`);
}

// ── classDef — class name ─────────────────────────────────────────────────

/** Asserts the HTML contains the classDef class-name color (bright cream). */
export function expectNameColor(html: string): void {
  expect(html).toContain(`color:${HL.name}`);
}

/** Asserts the HTML does NOT contain the classDef class-name color. */
export function expectNoNameColor(html: string): void {
  expect(html).not.toContain(`color:${HL.name}`);
}

// ── classDef — property key ───────────────────────────────────────────────

/** Asserts the HTML contains the classDef property-key color (forge teal). */
export function expectPropKeyColor(html: string): void {
  expect(html).toContain(`color:${HL.key}`);
}

/** Asserts the HTML does NOT contain the classDef property-key color. */
export function expectNoPropKeyColor(html: string): void {
  expect(html).not.toContain(`color:${HL.key}`);
}

// ── classDef — hex value ──────────────────────────────────────────────────

/** Asserts the HTML contains the hex-value color (sky blue). */
export function expectHexColor(html: string): void {
  expect(html).toContain(`color:${HL.hex}`);
}

/** Asserts the HTML does NOT contain the hex-value color. */
export function expectNoHexColor(html: string): void {
  expect(html).not.toContain(`color:${HL.hex}`);
}

// ── classDef — non-hex value ──────────────────────────────────────────────

/** Asserts the HTML contains the non-hex-value color (warm beige). */
export function expectValueColor(html: string): void {
  expect(html).toContain(`color:${HL.value}`);
}

/** Asserts the HTML does NOT contain the non-hex-value color. */
export function expectNoValueColor(html: string): void {
  expect(html).not.toContain(`color:${HL.value}`);
}

// ── classDef — punctuation / fallback dim ────────────────────────────────

/** Asserts the HTML contains the punctuation/dim color. */
export function expectPunctColor(html: string): void {
  expect(html).toContain(`color:${HL.punct}`);
}

/** Asserts the HTML does NOT contain the punctuation/dim color. */
export function expectNoPunctColor(html: string): void {
  expect(html).not.toContain(`color:${HL.punct}`);
}

// ── %%{init}%% directive ─────────────────────────────────────────────────

/** Asserts the HTML contains the init-directive bracket color (amber). */
export function expectInitBracketColor(html: string): void {
  expect(html).toContain(`color:${INIT_HL.bracket}`);
}

/** Asserts the HTML does NOT contain the init-directive bracket color. */
export function expectNoInitBracketColor(html: string): void {
  expect(html).not.toContain(`color:${INIT_HL.bracket}`);
}

/** Asserts the HTML contains the init-directive content color. */
export function expectInitContentColor(html: string): void {
  expect(html).toContain(`color:${INIT_HL.content}`);
}

/** Asserts the HTML does NOT contain the init-directive content color. */
export function expectNoInitContentColor(html: string): void {
  expect(html).not.toContain(`color:${INIT_HL.content}`);
}

// ── %% comment lines ─────────────────────────────────────────────────────

/** Asserts the HTML contains the comment text color. */
export function expectCommentColor(html: string): void {
  expect(html).toContain(`color:${COMMENT_HL.text}`);
}

/** Asserts the HTML does NOT contain the comment text color. */
export function expectNoCommentColor(html: string): void {
  expect(html).not.toContain(`color:${COMMENT_HL.text}`);
}

// ── Count helpers — for occurrence-counting assertions ────────────────────
// Use these instead of raw `html.match(new RegExp(`color:${HL.*}`, "g"))` in
// test files so the pattern lives in one place and tests read as plain English.

/** Returns the number of classDef keyword-color occurrences (`color:${HL.keyword}`). */
export function countKeywordColorOccurrences(html: string): number {
  return (html.match(new RegExp(`color:${HL.keyword}`, "g")) ?? []).length;
}

/** Returns the number of classDef property-key-color occurrences (`color:${HL.key}`). */
export function countPropKeyColorOccurrences(html: string): number {
  return (html.match(new RegExp(`color:${HL.key}`, "g")) ?? []).length;
}

/** Returns the number of hex-value-color occurrences (`color:${HL.hex}`). */
export function countHexColorOccurrences(html: string): number {
  return (html.match(new RegExp(`color:${HL.hex}`, "g")) ?? []).length;
}

/** Returns the number of init-directive bracket-color occurrences (`color:${INIT_HL.bracket}`). */
export function countInitBracketColorOccurrences(html: string): number {
  return (html.match(new RegExp(`color:${INIT_HL.bracket}`, "g")) ?? []).length;
}

/** Returns the number of init-directive content-color occurrences (`color:${INIT_HL.content}`). */
export function countInitContentColorOccurrences(html: string): number {
  return (html.match(new RegExp(`color:${INIT_HL.content}`, "g")) ?? []).length;
}
