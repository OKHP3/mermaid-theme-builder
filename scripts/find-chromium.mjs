import { existsSync } from "node:fs";
import { delimiter, sep } from "node:path";

/**
 * Find a system Chromium executable without invoking a platform-specific shell
 * command. The optional arguments keep the discovery rules independently
 * smoke-testable.
 */
export function findChromiumExecutablePath({
  env = process.env,
  platform = process.platform,
  exists = existsSync,
} = {}) {
  const exeSuffix = platform === "win32" ? ".exe" : "";
  const binaryNames = [
    `chromium${exeSuffix}`,
    `chromium-browser${exeSuffix}`,
    `chrome${exeSuffix}`,
  ];
  const pathDirs = (env.PATH ?? "").split(delimiter);
  const candidates = [
    env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    ...pathDirs.flatMap((directory) =>
      binaryNames.map((binaryName) => `${directory}${sep}${binaryName}`)
    ),
  ];

  return candidates.find((candidate) => !!candidate && exists(candidate));
}
