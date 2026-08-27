---
name: Serial Playwright suite runtime
description: Execution constraint for the project's large one-worker browser suite
---

The complete Playwright suite runs serially and can exceed the available shell execution window as the test count grows. Validation can also collide with a stale preview listener on port 4173; this produces an early `Port 4173 is already in use` message followed by widespread `ERR_CONNECTION_REFUSED` failures.

**Why:** A shell timeout can terminate a healthy run after many passing tests, while a preview-port collision can make almost every spec fail even though no application assertion regressed.

**How to apply:** Use focused specs for iterative work. For broad verification, inspect preview-server startup before interpreting connection-refused cascades, and split the suite into Playwright shards or smaller file groups when the command window is too short.