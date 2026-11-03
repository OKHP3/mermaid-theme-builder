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
  // Happy DOM does not implement Web Locks. Model exclusive ordering for unit
  // tests; real multi-tab locking is separately exercised in browser tests.
  if (!window.navigator) return;
  let tail = Promise.resolve();
  Object.defineProperty(window.navigator, "locks", {
    configurable: true,
    value: {
      request: async (_name: string, _options: unknown, work: () => unknown) => {
        const previous = tail;
        let release!: () => void;
        tail = new Promise<void>((resolve) => {
          release = resolve;
        });
        await previous;
        try {
          return await work();
        } finally {
          release();
        }
      },
    },
  });
});
