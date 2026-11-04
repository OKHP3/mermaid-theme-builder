import { useEffect, useRef, useState, type ReactNode } from "react";

export function ThemeDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border bg-card p-5 text-foreground shadow-2xl backdrop:bg-black/50"
    >
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </dialog>
  );
}

export const themeActionClass =
  "rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";

interface ThemeLibraryStatusProps {
  name: string;
  destination: string;
  dirty: boolean;
  saved: boolean;
  recovered: boolean;
  busy: boolean;
  error: string;
  warnings: string[];
  onSave: () => Promise<boolean>;
  onSaveCopy: (name: string) => Promise<boolean>;
  onBackup: () => void;
  onRecovery: () => void;
  onRestore: (json: string) => void;
}

export function ThemeLibraryStatus(props: ThemeLibraryStatusProps) {
  const [copyName, setCopyName] = useState<string | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);
  const save = async (operation: () => Promise<boolean>) => {
    setSavingTheme(true);
    try {
      return await operation();
    } finally {
      setSavingTheme(false);
    }
  };
  const file = useRef<HTMLInputElement>(null);
  const [readError, setReadError] = useState("");
  const status = props.error
    ? "Not saved"
    : props.busy
      ? "Saving to this browser"
      : props.dirty
        ? props.recovered
          ? "Draft recovered. Unsaved changes"
          : "Unsaved changes"
        : props.saved
          ? "Saved on this browser"
          : "Built-in starting theme";
  return (
    <section
      aria-label="Theme library status"
      className="flex-none border-b border-border bg-card px-3 py-2 print-hide"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 text-xs">
          <p className="hidden truncate font-semibold md:block">{props.name}</p>
          <p className="text-muted-foreground">
            <span className="hidden md:inline">
              {props.destination || "Generic Mermaid"} <span aria-hidden="true">· </span>
            </span>
            <span aria-live="polite">{status}</span>
          </p>
        </div>
        <button
          className={themeActionClass}
          disabled={savingTheme || !!props.error || (!props.dirty && props.saved)}
          onClick={() => void save(props.onSave)}
        >
          {props.saved ? "Save changes" : "Save theme"}
        </button>
        <button
          className={`${themeActionClass} hidden md:block`}
          disabled={savingTheme || !!props.error}
          onClick={() => setCopyName(`${props.name} (copy)`)}
        >
          Save as copy
        </button>
        <details className="relative text-xs">
          <summary className={`${themeActionClass} cursor-pointer`}>
            <span className="md:hidden">Library</span>
            <span className="hidden md:inline">Library backup</span>
          </summary>
          <div className="absolute right-0 z-40 mt-1 w-64 max-w-[85vw] space-y-2 rounded-lg border border-border bg-card p-3 shadow-lg">
            <button
              className={`${themeActionClass} md:hidden`}
              disabled={savingTheme || !!props.error}
              onClick={() => setCopyName(`${props.name} (copy)`)}
            >
              Save as copy
            </button>
            <p>Saved themes only. No diagram text.</p>
            <button className={themeActionClass} onClick={props.onBackup}>
              Download theme library
            </button>
            <button className={themeActionClass} onClick={() => file.current?.click()}>
              Restore library JSON
            </button>
            <button className={themeActionClass} onClick={props.onRecovery}>
              Download workspace recovery (includes diagram)
            </button>
          </div>
        </details>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          hidden
          aria-label="Restore theme library"
          onChange={async (event) => {
            const selected = event.target.files?.[0];
            event.target.value = "";
            if (!selected) return;
            if (selected.size > 5_000_000) {
              setReadError("The library file is too large. Keep the original for recovery.");
              return;
            }
            try {
              props.onRestore(await selected.text());
              setReadError("");
            } catch {
              setReadError("The file could not be read. Your existing library is unchanged.");
            }
          }}
        />
      </div>
      {(props.error || readError) && (
        <div role="alert" className="mt-2 text-xs text-destructive">
          <p>{props.error || readError}</p>
          <button className={`${themeActionClass} mt-2`} onClick={props.onRecovery}>
            Download workspace recovery (includes diagram)
          </button>
        </div>
      )}
      {props.warnings.length > 0 && (
        <details className="mt-1 text-xs text-muted-foreground">
          <summary>Recovery and compatibility notes</summary>
          <ul className="list-disc pl-5">
            {props.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
      {copyName !== null && (
        <ThemeDialog title="Save a complete theme copy" onClose={() => setCopyName(null)}>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (copyName.trim() && (await save(() => props.onSaveCopy(copyName))))
                setCopyName(null);
            }}
          >
            <label className="block text-xs">
              Theme name
              <input
                autoFocus
                value={copyName}
                onChange={(event) => setCopyName(event.target.value)}
                className="my-2 block w-full rounded-md border border-border bg-background p-2 text-sm"
              />
            </label>
            <p className="mb-3 text-xs text-muted-foreground">
              Includes colors, typography, destination, and output preferences. Diagram text stays
              separate.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className={themeActionClass} onClick={() => setCopyName(null)}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={!copyName.trim() || savingTheme || !!props.error}
                className={themeActionClass}
              >
                Save copy
              </button>
            </div>
          </form>
        </ThemeDialog>
      )}
    </section>
  );
}
