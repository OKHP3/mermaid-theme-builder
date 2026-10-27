import assert from "node:assert/strict";
import test from "node:test";
import { issueBody, syncIssue, marker } from "./update-technology-issue.mjs";
const clean = { npm: [], actions: [], runtimes: [], transitive: [], errors: [] };
const outdated = {
  ...clean,
  npm: [{ name: "demo", current: "1.0.0", latest: "2.0.0", status: "update-available" }],
};

test("unchanged backlog does not update the issue", async () => {
  const calls = [];
  const api = async (...args) => {
    calls.push(args);
    return [{ number: 1, body: issueBody(outdated) }];
  };
  assert.equal(await syncIssue({ ...outdated, generatedAt: "tomorrow" }, api), "unchanged");
  assert.equal(calls.length, 1);
});

test("audit errors keep a review issue open", async () => {
  const calls = [];
  const api = async (...args) => {
    calls.push(args);
    return args[0] === "GET" ? [{ number: 1, body: marker }] : {};
  };
  assert.equal(await syncIssue({ ...clean, errors: ["registry unavailable"] }, api), "updated");
  assert.equal(calls[1][2].state, undefined);
});

test("only complete clean reports close a matching issue", async () => {
  const calls = [];
  const api = async (...args) => {
    calls.push(args);
    return args[0] === "GET" ? [{ number: 2, body: marker }] : {};
  };
  assert.equal(await syncIssue(clean, api), "closed");
  assert.deepEqual(calls[1], ["PATCH", "/issues/2", { state: "closed" }]);
});

test("pagination finds an existing issue before creating another", async () => {
  const calls = [];
  const api = async (...args) => {
    calls.push(args);
    return args[1].endsWith("page=1")
      ? Array.from({ length: 100 }, () => ({ body: "unrelated" }))
      : [{ number: 3, body: issueBody(outdated) }];
  };
  assert.equal(await syncIssue(outdated, api), "unchanged");
  assert.equal(calls.length, 2);
});

test("a new backlog creates one issue and no-stable releases require review", async () => {
  const calls = [];
  const api = async (...args) => {
    calls.push(args);
    return [];
  };
  assert.equal(await syncIssue(outdated, api), "created");
  assert.equal(calls[1][0], "POST");
  assert.ok(
    issueBody({
      ...clean,
      transitive: [{ name: "preview", current: "1.0.0-0", status: "no-stable-release" }],
    })
  );
});
