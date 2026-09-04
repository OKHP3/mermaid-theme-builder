import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { REQUIRED_CHECKS, validateCiWorkflow } from "./lib/ci-workflow-contract.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workflow = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

function errorsFor(candidate) {
  return validateCiWorkflow(candidate, packageJson);
}

test("the current CI workflow satisfies the contract", () => {
  assert.deepEqual(errorsFor(workflow), []);
});

test("push and pull requests must target main", () => {
  const withoutPushMain = workflow.replace(
    "  push:\n    branches: [main]",
    "  push:\n    branches: [develop]"
  );
  const withoutPullRequestMain = workflow.replace(
    "  pull_request:\n    branches: [main]",
    "  pull_request:\n    branches: [develop]"
  );

  assert.match(errorsFor(withoutPushMain).join("\n"), /push.*does not target main/);
  assert.match(errorsFor(withoutPullRequestMain).join("\n"), /pull_request.*does not target main/);
});

for (const check of REQUIRED_CHECKS) {
  const command = `pnpm run ${check}`;
  const runLine = `        run: ${command}`;

  test(`${check} cannot be removed`, () => {
    assert.match(
      errorsFor(workflow.replace(runLine, "")).join("\n"),
      new RegExp(`active ci job is missing "${command}"`)
    );
  });

  test(`${check} cannot be hidden in a comment`, () => {
    assert.match(
      errorsFor(workflow.replace(runLine, `        # run: ${command}`)).join("\n"),
      new RegExp(`active ci job is missing "${command}"`)
    );
  });

  test(`${check} cannot be placed in a disabled step`, () => {
    const disabled = workflow.replace(runLine, `        if: false\n${runLine}`);
    assert.match(
      errorsFor(disabled).join("\n"),
      new RegExp(`active ci job is missing "${command}"`)
    );
  });

  test(`${check} cannot be satisfied by another job`, () => {
    const moved = `${workflow.replace(runLine, "")}
  decoy:
    runs-on: ubuntu-latest
    steps:
      - run: ${command}
`;
    assert.match(errorsFor(moved).join("\n"), new RegExp(`active ci job is missing "${command}"`));
  });
}
