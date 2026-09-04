export const REQUIRED_CHECKS = [
  "check:ci-workflow",
  "check:version-strings",
  "check:doc-truth",
  "check:skills-catalog",
  "check:source-refs",
];

function indentation(line) {
  return line.match(/^ */)?.[0].length ?? 0;
}

function activeLines(workflow) {
  return workflow.split(/\r?\n/).map((line) => {
    if (/^\s*#/.test(line)) return "";
    return line.replace(/\s+#.*$/, "").trimEnd();
  });
}

function findKey(lines, key, indent, start = 0, end = lines.length) {
  const pattern = new RegExp(`^ {${indent}}${key}:\\s*$`);
  for (let index = start; index < end; index += 1) {
    if (pattern.test(lines[index])) return index;
  }
  return -1;
}

function blockEnd(lines, start, indent, limit = lines.length) {
  for (let index = start + 1; index < limit; index += 1) {
    if (lines[index].trim() && indentation(lines[index]) <= indent) return index;
  }
  return limit;
}

function hasFalseCondition(lines, indent) {
  const condition = lines.find((line) => new RegExp(`^ {${indent}}if:\\s*`).test(line));
  if (!condition) return false;
  const value = condition
    .replace(/^\s*if:\s*/, "")
    .replace(/["'\s]/g, "")
    .toLowerCase();
  return value === "false" || value === "${{false}}";
}

function eventTargetsMain(lines, onStart, onEnd, eventName, errors) {
  const eventStart = findKey(lines, eventName, 2, onStart + 1, onEnd);
  if (eventStart === -1) {
    errors.push(`workflow trigger "${eventName}" is missing`);
    return;
  }

  const eventEnd = blockEnd(lines, eventStart, 2, onEnd);
  const branchesIndex = findKey(lines, "branches", 4, eventStart + 1, eventEnd);
  const inlineBranchesIndex = lines.findIndex(
    (line, index) =>
      index > eventStart && index < eventEnd && /^ {4}branches:\s*\[[^\]]*\]\s*$/.test(line)
  );
  const actualBranchesIndex =
    branchesIndex === -1 ? inlineBranchesIndex : Math.min(branchesIndex, inlineBranchesIndex);

  if (actualBranchesIndex === -1) {
    errors.push(`workflow trigger "${eventName}" has no branches filter`);
    return;
  }

  const inline = lines[actualBranchesIndex].match(/branches:\s*\[([^\]]*)\]/)?.[1];
  const hasMain = inline
    ? inline
        .split(",")
        .map((branch) => branch.trim())
        .includes("main")
    : lines
        .slice(actualBranchesIndex + 1, eventEnd)
        .some((line) => indentation(line) > 4 && line.trim() === "- main");

  if (!hasMain) errors.push(`workflow trigger "${eventName}" does not target main`);
}

function activeCiCommands(lines, errors) {
  const jobsStart = findKey(lines, "jobs", 0);
  if (jobsStart === -1) {
    errors.push('workflow "jobs" configuration is missing');
    return new Set();
  }

  const jobsEnd = blockEnd(lines, jobsStart, 0);
  const ciStart = findKey(lines, "ci", 2, jobsStart + 1, jobsEnd);
  if (ciStart === -1) {
    errors.push('workflow job "ci" is missing');
    return new Set();
  }

  const ciEnd = blockEnd(lines, ciStart, 2, jobsEnd);
  if (hasFalseCondition(lines.slice(ciStart + 1, ciEnd), 4)) {
    errors.push('workflow job "ci" is disabled');
    return new Set();
  }

  const stepsStart = findKey(lines, "steps", 4, ciStart + 1, ciEnd);
  if (stepsStart === -1) {
    errors.push('workflow job "ci" has no steps');
    return new Set();
  }

  const commands = new Set();
  const stepStarts = [];
  for (let index = stepsStart + 1; index < ciEnd; index += 1) {
    if (/^ {6}-\s+/.test(lines[index])) stepStarts.push(index);
  }

  for (let position = 0; position < stepStarts.length; position += 1) {
    const start = stepStarts[position];
    const end = stepStarts[position + 1] ?? ciEnd;
    const step = lines.slice(start, end);
    if (hasFalseCondition(step, 8)) continue;

    const inlineRun = step[0].match(/^ {6}-\s+run:\s*(.+)$/)?.[1];
    const runLine = step.find((line) => /^ {8}run:\s*\S/.test(line));
    const command = inlineRun ?? runLine?.replace(/^ {8}run:\s*/, "");
    if (command && command !== "|" && command !== ">") commands.add(command.trim());
  }

  return commands;
}

export function validateCiWorkflow(workflow, packageJson) {
  const lines = activeLines(workflow);
  const errors = [];
  const onStart = lines.findIndex((line) => line === "on:" || line === '"on":');

  if (onStart === -1) {
    errors.push('workflow "on" configuration is missing');
  } else {
    const onEnd = blockEnd(lines, onStart, 0);
    eventTargetsMain(lines, onStart, onEnd, "push", errors);
    eventTargetsMain(lines, onStart, onEnd, "pull_request", errors);
  }

  const commands = activeCiCommands(lines, errors);
  for (const check of REQUIRED_CHECKS) {
    const command = `pnpm run ${check}`;
    if (typeof packageJson.scripts?.[check] !== "string") {
      errors.push(`package.json is missing the "${check}" script`);
    }
    if (!commands.has(command)) {
      errors.push(`active ci job is missing "${command}"`);
    }
  }

  return errors;
}
