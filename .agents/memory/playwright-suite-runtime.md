---
name: Serial Playwright suite runtime
description: Execution constraint for the project's large one-worker browser suite
---

The complete Playwright suite runs serially and can exceed the available five-minute shell execution window as the test count grows.

**Why:** A shell timeout can terminate a healthy run after many passing tests, making the result look like a test failure even when no assertion failed.

**How to apply:** Use focused specs for iterative work; for broad verification, split the suite into Playwright shards or smaller file groups and report any command-window limitation separately from test failures.