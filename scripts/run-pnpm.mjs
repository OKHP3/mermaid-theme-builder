#!/usr/bin/env node
import { readFileSync, realpathSync, existsSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const { packageManager } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);
if (!/^pnpm@\d+\.\d+\.\d+$/.test(packageManager))
  throw new Error("An exact stable pnpm pin is required");
// npm resolves pnpm 12's native launcher. Old Corepack versions expect a removed JS entry point.
const windows = process.platform === "win32";
const executable = execFileSync(windows ? "where.exe" : "which", [windows ? "npm.cmd" : "npm"], {
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/)[0];
const npmCli = windows
  ? resolve(dirname(executable), "node_modules/npm/bin/npm-cli.js")
  : realpathSync(executable);
if (!existsSync(npmCli))
  throw new Error(
    "Cannot locate npm's CLI beside its launcher. Install a supported Node.js distribution."
  );
const child = spawn(
  process.execPath,
  [npmCli, "exec", "--yes", `--package=${packageManager}`, "--", "pnpm", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    shell: false,
  }
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
