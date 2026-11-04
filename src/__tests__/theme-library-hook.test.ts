// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useThemeLibrary } from "@/hooks/useThemeLibrary";
import { THEME_LIBRARY_KEY } from "@/lib/theme-library";

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: (_name: string, _options: unknown, work: () => unknown) => Promise.resolve(work()),
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("library write queue", () => {
  it("serializes operations in the same tab against the latest revision", async () => {
    const { result } = renderHook(() => useThemeLibrary());
    await act(async () => {
      await Promise.all([
        result.current.update((state) => ({
          ...state,
          editorSession: { ...state.editorSession, inputCode: "diagram A" },
        })),
        result.current.update((state) => ({
          ...state,
          editorSession: {
            ...state.editorSession,
            inputCode: state.editorSession.inputCode + " then B",
          },
        })),
      ]);
    });
    expect(result.current.state?.revision).toBe(2);
    expect(result.current.state?.editorSession.inputCode).toBe("diagram A then B");
    expect(JSON.parse(localStorage.getItem(THEME_LIBRARY_KEY)!).revision).toBe(2);
  });

  it("keeps canonical state unchanged when a write fails", async () => {
    const { result } = renderHook(() => useThemeLibrary());
    const initial = result.current.state;
    const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Storage access denied");
      },
    });
    try {
      await act(async () => {
        expect(
          await result.current.update((state) => ({
            ...state,
            editorSession: { ...state.editorSession, inputCode: "unsaved" },
          }))
        ).toBeNull();
      });
    } finally {
      Object.defineProperty(window, "localStorage", descriptor);
    }
    expect(result.current.state).toBe(initial);
    expect(result.current.error).toContain("storage is unavailable");
  });

  it("stops automatic writes after an external change without clearing data", async () => {
    const { result } = renderHook(() => useThemeLibrary());
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: THEME_LIBRARY_KEY })));
    await act(async () => {
      expect(await result.current.update((state) => state)).toBeNull();
    });
    expect(localStorage.getItem(THEME_LIBRARY_KEY)).toBeNull();
    expect(result.current.error).toContain("Another tab");
    expect(Object.keys(localStorage).some((key) => key.startsWith("mtb.recovery."))).toBe(true);
  });
});
