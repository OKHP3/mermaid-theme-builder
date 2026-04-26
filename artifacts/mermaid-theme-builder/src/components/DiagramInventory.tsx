import { useState, useMemo } from "react";
import {
  DIAGRAM_CAPABILITIES,
  CAPABILITY_GAPS,
  MERMAID_VERSION_VERIFIED,
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_STYLES,
  THEME_CONFIDENCE_LABELS,
  THEME_CONFIDENCE_STYLES,
  NOTATION_COMPLIANCE_LABELS,
  STABILITY_LABELS,
  type DiagramCapability,
  type GapEntry,
  type SupportStatus,
  type GapSupportStatus,
} from "@/data/mermaid-capabilities";

type FilterTab = "all" | "native" | "partial" | "experimental" | "gaps";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "native", label: "Native" },
  { id: "partial", label: "Beta / Partial" },
  { id: "experimental", label: "Experimental" },
  { id: "gaps", label: "Gaps & Unsupported" },
];

function StatusBadge({ status }: { status: SupportStatus | GapSupportStatus }) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${SUPPORT_STATUS_STYLES[status]}`}
    >
      {SUPPORT_STATUS_LABELS[status]}
    </span>
  );
}

function ThemeBadge({ confidence }: { confidence: string }) {
  const style =
    THEME_CONFIDENCE_STYLES[confidence as keyof typeof THEME_CONFIDENCE_STYLES] ??
    "bg-muted text-muted-foreground";
  const label =
    THEME_CONFIDENCE_LABELS[confidence as keyof typeof THEME_CONFIDENCE_LABELS] ?? confidence;
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded ${style}`}>
      {label}
    </span>
  );
}

function StabilityDot({ stability }: { stability: string }) {
  const colors: Record<string, string> = {
    stable: "bg-emerald-400",
    beta: "bg-sky-400",
    experimental: "bg-purple-400",
    unknown: "bg-muted-foreground",
  };
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${colors[stability] ?? colors.unknown}`}
      title={STABILITY_LABELS[stability as keyof typeof STABILITY_LABELS] ?? stability}
    />
  );
}

function CapabilityRow({ cap }: { cap: DiagramCapability }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-3 py-2.5 align-top">
        <div className="flex items-center gap-1.5">
          <StabilityDot stability={cap.stability} />
          <span className="text-xs font-medium text-foreground whitespace-nowrap">{cap.displayName}</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{cap.id}</div>
      </td>
      <td className="px-3 py-2.5 align-top">
        <StatusBadge status={cap.supportStatus} />
      </td>
      <td className="px-3 py-2.5 align-top">
        <ThemeBadge confidence={cap.themeConfidence} />
      </td>
      <td className="px-3 py-2.5 align-top hidden md:table-cell">
        <span className="text-[10px] text-muted-foreground">
          {NOTATION_COMPLIANCE_LABELS[cap.notationCompliance]}
        </span>
      </td>
      <td className="px-3 py-2.5 align-top hidden lg:table-cell max-w-[220px]">
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {cap.description}
        </p>
      </td>
      <td className="px-3 py-2.5 align-top">
        {cap.exampleFile ? (
          <div className="flex items-center gap-1">
            {cap.examplePending ? (
              <span className="text-[10px] text-muted-foreground/60 italic">pending</span>
            ) : (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                ✓
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-mono hidden xl:block truncate max-w-[160px]">
              {cap.exampleFile}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 align-top w-6">
        {(cap.warning || cap.notes) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-amber-500 hover:text-amber-600 dark:text-amber-400 transition-colors"
            title="Show warning / notes"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        {expanded && (cap.warning || cap.notes) && (
          <div
            className="absolute z-10 mt-1 w-64 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700/40 p-2.5 shadow-md text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed"
            onClick={() => setExpanded(false)}
          >
            {cap.warning && <p className="mb-1">{cap.warning}</p>}
            {cap.notes && cap.notes !== cap.warning && (
              <p className="text-muted-foreground">{cap.notes}</p>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function GapRow({ gap }: { gap: GapEntry }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-3 py-2.5 align-top">
        <span className="text-xs font-medium text-foreground whitespace-nowrap">{gap.displayName}</span>
        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{gap.id}</div>
      </td>
      <td className="px-3 py-2.5 align-top">
        <StatusBadge status={gap.supportStatus} />
      </td>
      <td className="px-3 py-2.5 align-top">
        <ThemeBadge confidence={gap.themeConfidence} />
      </td>
      <td className="px-3 py-2.5 align-top hidden md:table-cell">
        <span className="text-[10px] text-muted-foreground">
          {NOTATION_COMPLIANCE_LABELS[gap.notationCompliance]}
        </span>
      </td>
      <td className="px-3 py-2.5 align-top hidden lg:table-cell max-w-[220px]">
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {gap.description}
        </p>
        {gap.approximatedBy && (
          <span className="inline-block mt-0.5 text-[10px] text-sky-600 dark:text-sky-400">
            Approx. via {gap.approximatedBy}
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 align-top">
        <span className="text-[10px] text-muted-foreground/40 italic">none</span>
      </td>
      <td className="px-3 py-2.5 align-top w-6 relative">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-amber-500 hover:text-amber-600 dark:text-amber-400 transition-colors"
          title="Show warning"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {expanded && (
          <div
            className="absolute right-0 z-10 mt-1 w-72 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700/40 p-2.5 shadow-md text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed"
            onClick={() => setExpanded(false)}
          >
            {gap.warning}
          </div>
        )}
      </td>
    </tr>
  );
}

interface DiagramInventoryProps {
  onClose: () => void;
}

export function DiagramInventory({ onClose }: DiagramInventoryProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const filteredCapabilities = useMemo(() => {
    let caps = DIAGRAM_CAPABILITIES.filter((c) => c.id !== "unknown");
    if (filter === "native") caps = caps.filter((c) => c.supportStatus === "native");
    else if (filter === "partial") caps = caps.filter((c) => c.supportStatus === "partial");
    else if (filter === "experimental") caps = caps.filter((c) => c.stability === "experimental");
    else if (filter === "gaps") caps = [];
    if (search.trim()) {
      const q = search.toLowerCase();
      caps = caps.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.bestUsedFor.toLowerCase().includes(q),
      );
    }
    return caps;
  }, [filter, search]);

  const filteredGaps = useMemo(() => {
    if (filter !== "all" && filter !== "gaps") return [];
    let gaps = CAPABILITY_GAPS;
    if (search.trim()) {
      const q = search.toLowerCase();
      gaps = gaps.filter(
        (g) =>
          g.displayName.toLowerCase().includes(q) ||
          g.id.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q),
      );
    }
    return gaps;
  }, [filter, search]);

  const tableHeader = (
    <thead>
      <tr className="border-b border-border bg-muted/40">
        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-36">
          Diagram Type
        </th>
        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-24">
          Support
        </th>
        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-28">
          Theme Confidence
        </th>
        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
          Notation
        </th>
        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
          Description
        </th>
        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-20">
          Example
        </th>
        <th className="px-3 py-2 w-6" />
      </tr>
    </thead>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      <div className="border-b border-border bg-card/80 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-primary">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-none">
              Diagram Inventory
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
              {DIAGRAM_CAPABILITIES.filter((c) => c.id !== "unknown").length} Mermaid families ·{" "}
              {CAPABILITY_GAPS.length} gaps tracked
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diagrams…"
            className="text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-40 sm:w-52"
          />
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md border border-border hover:bg-muted"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
            <span className="hidden sm:inline">Back to Builder</span>
          </button>
        </div>
      </div>

      <div className="border-b border-border bg-card/30 px-4 md:px-6 py-1.5 flex gap-0.5 shrink-0">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              filter === tab.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredCapabilities.length > 0 && (
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mermaid Families
              </h3>
              <span className="text-[10px] text-muted-foreground/60">
                {filteredCapabilities.length} entries
              </span>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left relative">
                {tableHeader}
                <tbody>
                  {filteredCapabilities.map((cap) => (
                    <CapabilityRow key={cap.id} cap={cap} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredGaps.length > 0 && (
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Capability Gaps
              </h3>
              <span className="text-[10px] text-muted-foreground/60">
                {filteredGaps.length} entries
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-400/20">
                Not implementable in Mermaid
              </span>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left relative">
                {tableHeader}
                <tbody>
                  {filteredGaps.map((gap) => (
                    <GapRow key={gap.id} gap={gap} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredCapabilities.length === 0 && filteredGaps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-muted-foreground/30 mb-3">
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-muted-foreground">No results for "{search}"</p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        <div className="px-4 md:px-6 py-4 border-t border-border bg-muted/10">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Stable
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" /> Beta
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" /> Experimental
            </div>
            <span className="text-muted-foreground/40">·</span>
            <span>
              Support Status shows whether Mermaid natively supports this diagram type. Theme
              Confidence shows how reliably Mermaid Theme Builder can control the visual output.
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-2">
            Mermaid Theme Builder does not implement unsupported formal notations (BPMN, ArchiMate,
            SysML). Gaps are tracked for honest reference only. Verified against Mermaid{" "}
            {MERMAID_VERSION_VERIFIED}.
          </p>
        </div>
      </div>
    </div>
  );
}
