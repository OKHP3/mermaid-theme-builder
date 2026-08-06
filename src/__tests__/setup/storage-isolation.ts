/**
 * Global per-test storage isolation.
 *
 * Runs a beforeEach that wipes localStorage and sessionStorage before every
 * test so that no state bleeds between tests within a file (or across files
 * when the environment is reused).
 *
 * The window/storage guards make this safe in node-environment tests where
 * those globals are not defined.
 */
import { beforeEach } from "vitest";

beforeEach(() => {
  if (typeof window === "undefined") return;
  if (typeof window.localStorage !== "undefined") {
    window.localStorage.clear();
  }
  if (typeof window.sessionStorage !== "undefined") {
    window.sessionStorage.clear();
  }
});
