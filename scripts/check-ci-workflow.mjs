#!/usr/bin/env node
/**
 * Assert the repository's required CI workflow contract.
 *
 * This intentionally uses only Node's standard library so it can run locally
 * and in CI without credentials or a YAML dependency.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workflowPath = resolve(root, ".github/workflows/ci.yml");
const packagePath = resolve(root, "package.json");

const workflow = readFileSync(workflowPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const lines = workflow.split(/\r?\n/);
const errors = [];

function topLevelBlock(startIndex) {
  const block = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() && !/^\s/.test(line)) break;
    block.push(line);
  }
  return block;
}

function eventBlock(onBlock, eventName) {
  const start = onBlock.findIndex((line) => new RegExp(`^  ${eventName}:\\s*$`).test(line));
  if (start === -1) return null;

  const block = [];
  for (let index = start; index < onBlock.length; index += 1) {
    if (index > start && /^  [\w-]+:\s*$/.test(onBlock[index])) break;
    block.push(onBlock[index]);
  }
  return block;
}

function targetsMain(block, eventName) {
  if (!block) {
    errors.push(`workflow trigger "${eventName}" is missing`);
    return;
  }

  const branchesIndex = block.findIndex((line) => /^\s+branches:\s*/.test(line));
  if (branchesIndex === -1) {
    errors.push(`workflow trigger "${eventName}" has no branches filter`);
    return;
  }

  const inlineBranches = block[branchesIndex].match(/branches:\s*\[([^\]]*)\]/)?.[1];
  if (inlineBranches) {
    if (
      !inlineBranches
        .split(",")
        .map((branch) => branch.trim())
        .includes("main")
    ) {
      errors.push(`workflow trigger "${eventName}" does not target main`);
    }
    return;
  }

  const hasMainBranch = block.slice(branchesIndex + 1).some((line) => line.trim() === "- main");
  if (!hasMainBranch) {
    errors.push(`workflow trigger "${eventName}" does not target main`);
  }
}

const onIndex = lines.findIndex((line) => line === "on:" || line === '"on":');
if (onIndex === -1) {
  errors.push('workflow "on" configuration is missing');
} else {
  const onBlock = topLevelBlock(onIndex);
  targetsMain(eventBlock(onBlock, "push"), "push");
  targetsMain(eventBlock(onBlock, "pull_request"), "pull_request");
}

const requiredChecks = [
  "check:version-strings",
  "check:doc-truth",
  "check:skills-catalog",
  "check:source-refs",
];

for (const check of requiredChecks) {
  const command = `pnpm run ${check}`;
  if (typeof packageJson.scripts?.[check] !== "string") {
    errors.push(`package.json is missing the "${check}" script`);
  }
  if (!workflow.includes(`run: ${command}`)) {
    errors.push(`.github/workflows/ci.yml is missing "${command}"`);
  }
}

if (errors.length > 0) {
  console.error("FAIL: CI workflow contract drift detected.");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log("PASS: CI workflow triggers and required integrity checks are present.");
