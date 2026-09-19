import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { needsReview } from "./lib/technology-versions.mjs";

export const marker = "<!-- mermaid-theme-builder:technology-audit -->";
const title = "Technology updates requiring review";

export function issueBody(report) {
  const rows = [...report.npm, ...report.actions, ...report.runtimes].filter(needsReview);
  const exceptions = report.transitive.filter((r) =>
    ["no-stable-release", "prerelease-in-use", "unknown", "error"].includes(r.status)
  );
  if (!rows.length && !exceptions.length && !report.errors.length) return null;
  const lines = [
    ...new Set(
      [...rows, ...exceptions].map(
        (r) =>
          `- ${r.name}: ${r.current ?? r.declared ?? "unknown"} -> ${r.latest ?? "no stable release verified"} (${r.status})${r.file ? ` in ${r.file}` : ""}`
      )
    ),
  ].sort();
  // Exclude timestamps and the source SHA: an unchanged backlog should stay quiet.
  return [
    marker,
    "# Technology updates requiring review",
    "",
    "Dependabot proposes npm and workflow updates. Review this list for runtime changes, local composite actions, ignored majors, and stalled update PRs.",
    "",
    ...lines,
    "",
    ...report.errors.map((e) => `- Audit error: ${e}`),
    "",
    "Use the latest Technology Version Audit workflow artifact for the complete inventory and source links.",
    "",
    "Acceptance: frozen install, audit tests, unit tests, typecheck, format, build, skill tests, and Playwright. Mermaid changes also require capability-registry review. Retain the pnpm release-age setting. Update Replit and Windows runtimes only after compatibility checks. Do not merge a failing update or downgrade to an older latest tag.",
    "",
    "See docs/technology-inventory.md for the upgrade sequence. This issue closes only after a complete audit has no remaining review items.",
  ].join("\n");
}

export async function syncIssue(report, api) {
  const body = issueBody(report);
  let existing;
  for (let page = 1; ; page++) {
    const issues = await api("GET", `/issues?state=open&per_page=100&page=${page}`);
    existing = issues.find((issue) => !issue.pull_request && issue.body?.startsWith(marker));
    if (existing || issues.length < 100) break;
  }
  if (!body) {
    if (existing) await api("PATCH", `/issues/${existing.number}`, { state: "closed" });
    return existing ? "closed" : "clear";
  }
  if (!existing) {
    await api("POST", "/issues", { title, body });
    return "created";
  }
  if (existing.body === body) return "unchanged";
  await api("PATCH", `/issues/${existing.number}`, { body });
  return "updated";
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = JSON.parse(readFileSync(process.argv[2], "utf8"));
  if (process.argv.includes("--dry-run")) console.log(issueBody(report) ?? "No review items");
  else {
    const repository = process.env.GITHUB_REPOSITORY;
    const token = process.env.GITHUB_TOKEN;
    if (!repository || !token) throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required");
    const api = async (method, path, body) => {
      const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/vnd.github+json",
          "content-type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error(`Issue operation failed: HTTP ${response.status}`);
      return response.json();
    };
    console.log(`Technology review issue: ${await syncIssue(report, api)}`);
  }
}
