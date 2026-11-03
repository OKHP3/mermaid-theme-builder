import { useCallback, useEffect, useRef, useState } from "react";
import type { GovernanceProfile } from "@/lib/governance-profile";
import {
  browserLibraryLock,
  loadThemeLibrary,
  prepareThemeLibrary,
  writeThemeLibrary,
  THEME_LIBRARY_KEY,
  LEGACY_THEME_KEY,
  type ThemeLibrary,
} from "@/lib/theme-library";

/** Timestamps describe edits; they do not make an otherwise identical draft dirty. */
export function sameTheme(a: GovernanceProfile, b: GovernanceProfile): boolean {
  const content = (theme: GovernanceProfile) => {
    const { createdAt: _created, updatedAt: _updated, ...rest } = theme;
    const normalize = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(normalize);
      if (value && typeof value === "object")
        return Object.fromEntries(
          Object.entries(value)
            .filter(([, item]) => item !== undefined)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, item]) => [key, normalize(item)])
        );
      return value;
    };
    return JSON.stringify(
      normalize({ ...rest, advancedMermaidConfig: rest.advancedMermaidConfig ?? {} })
    );
  };
  return content(a) === content(b);
}

export function useThemeLibrary() {
  const [initial] = useState(() => {
    try {
      return loadThemeLibrary(window.localStorage);
    } catch {
      return {
        ok: false as const,
        error: "Browser storage is unavailable. Download your work before leaving this tab.",
      };
    }
  });
  const [state, setState] = useState<ThemeLibrary | null>(initial.ok ? initial.state : null);
  const stateRef = useRef(state);
  const [error, setError] = useState(initial.ok ? "" : initial.error);
  const stopped = useRef(!initial.ok);
  const tail = useRef<Promise<unknown>>(Promise.resolve());
  const [busy, setBusy] = useState(false);
  const recovery = useRef<ThemeLibrary | null>(state);
  const conflictRecoveryKey = useRef<string | null>(null);

  const update = useCallback(
    (change: (current: ThemeLibrary) => ThemeLibrary): Promise<ThemeLibrary | null> => {
      const operation = async () => {
        const current = stateRef.current;
        if (!current) return null;
        const next = change(structuredClone(current));
        recovery.current = next;
        if (stopped.current) {
          // A stopped tab may retain its work under its own key, but must never
          // write the canonical library after observing another tab's change.
          try {
            conflictRecoveryKey.current ??= `mtb.recovery.${crypto.randomUUID()}`;
            const json = JSON.stringify(next);
            window.localStorage.setItem(conflictRecoveryKey.current, json);
            if (window.localStorage.getItem(conflictRecoveryKey.current) !== json)
              throw new Error("Recovery readback failed");
          } catch {
            setError(
              "Saved data changed or storage is unavailable, and a recovery copy could not be stored. Keep this tab open and download your work."
            );
          }
          return null;
        }
        setBusy(true);
        try {
          const result = await writeThemeLibrary(
            next,
            current.revision,
            window.localStorage,
            browserLibraryLock()
          );
          if (!result.ok) {
            stopped.current = true;
            setError(result.error);
            return null;
          }
          stateRef.current = result.state;
          recovery.current = result.state;
          setState(result.state);
          return result.state;
        } catch {
          stopped.current = true;
          setError("Browser storage is unavailable. Keep this tab open and download your work.");
          return null;
        } finally {
          setBusy(false);
        }
      };
      const next = tail.current.then(operation, operation);
      tail.current = next;
      return next;
    },
    []
  );

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_LIBRARY_KEY && event.key !== LEGACY_THEME_KEY && event.key !== null)
        return;
      stopped.current = true;
      setError(
        "Another tab changed saved data. Your edits remain here. Download workspace recovery before reloading to read the other tab's changes."
      );
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const recover = useCallback(
    (working: GovernanceProfile[], session: ThemeLibrary["editorSession"]) => {
      const current = recovery.current ?? stateRef.current;
      if (current) return { ...current, drafts: working, editorSession: session };
      const empty = prepareThemeLibrary(null);
      if (!empty.ok) throw new Error(empty.error);
      return { ...empty.state, drafts: working, editorSession: session };
    },
    []
  );

  return { initial, state, stateRef, update, error, busy, recover };
}
