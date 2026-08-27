/**
 * Confirms that the Prettier format gate also protects TypeScript source files.
 *
 * The `pnpm run format` script checks TypeScript, TSX, and CSS files under
 * `src`. The CSS
 * companion test proves the CSS path, while this file locks in the TypeScript
 * parser used for the app's `.ts` and `.tsx` sources.
 */

import { describe, it, expect } from "vitest";
import prettier from "prettier";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const prettierConfig = JSON.parse(readFileSync(resolve(root, ".prettierrc"), "utf8")) as Record<
  string,
  unknown
>;

/** Returns true when the TypeScript source is already formatted by the project gate. */
async function isFormatted(source: string): Promise<boolean> {
  return prettier.check(source, { ...prettierConfig, parser: "typescript" });
}

describe("Prettier TypeScript format gate", () => {
  it("catches an unformatted TypeScript object literal", async () => {
    const unformatted = 'const palette={name:"Ocean",colors:["#123456","#abcdef"]};\n';

    expect(await isFormatted(unformatted)).toBe(false);
  });

  it("accepts a correctly formatted TypeScript snippet", async () => {
    const formatted = [
      "const palette = {",
      '  name: "Ocean",',
      '  colors: ["#123456", "#abcdef"],',
      "};",
      "",
    ].join("\n");

    expect(await isFormatted(formatted)).toBe(true);
  });

  it("accepts the project's typography module", async () => {
    const source = readFileSync(resolve(root, "src/lib/typography.ts"), "utf8");

    expect(await isFormatted(source)).toBe(true);
  });
});
