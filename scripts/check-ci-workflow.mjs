#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCiWorkflow } from "./lib/ci-workflow-contract.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workflow = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const errors = validateCiWorkflow(workflow, packageJson);

if (errors.length > 0) {
  console.error("FAIL: CI workflow contract drift detected.");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log("PASS: CI workflow triggers and active integrity checks are present.");
