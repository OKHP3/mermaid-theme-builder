import { useState, useCallback, useMemo } from "react";

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function textColorFor(bg) {
  return luminance(bg) > 0.55 ? "#333333" : "#FFFFFF";
}

function darken(hex, amount = 0.15) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  const nr = Math.round(r * f).toString(16).padStart(2, "0");
  const ng = Math.round(g * f).toString(16).padStart(2, "0");
  const nb = Math.round(b * f).toString(16).padStart(2, "0");
  return `#${nr}${ng}${nb}`;
}

const PRESETS = {
  bfs: {
    name: "BFS Light",
    primaryDark: "#00205B",
    primaryMedium: "#003087",
    primaryDeep: "#002F86",
    accent: "#307FE2",
    supportMed: "#B3C1DB",
    supportLight: "#D6E5F9",
    neutral: "#D0D0CE",
    canvas: "#E7E6E6",
    panel: "#F2F2F2",
    signalRed: "#C8102E",
    borderGray: "#A7A8A9",
    medGray: "#75787B",
    slate: "#515151",
    fontFamily: "Segoe UI, Arial, Helvetica, sans-serif",
    fontSize: "14px",
  },
  overkill: {
    name: "OverKill Hill",
    primaryDark: "#111827",
    primaryMedium: "#1F2937",
    primaryDeep: "#374151",
    accent: "#D97706",
    supportMed: "#92400E",
    supportLight: "#FEF3C7",
    neutral: "#374151",
    canvas: "#0F172A",
    panel: "#1E293B",
    signalRed: "#DC2626",
    borderGray: "#6B7280",
    medGray: "#9CA3AF",
    slate: "#4B5563",
    fontFamily: "Segoe UI, Arial, Helvetica, sans-serif",
    fontSize: "14px",
  },
  gleefully: {
    name: "Glee-fully",
    primaryDark: "#2D6F7E",
    primaryMedium: "#D94F63",
    primaryDeep: "#2D6F7E",
    accent: "#D94F63",
    supportMed: "#F6F2EE",
    supportLight: "#FFF0ED",
    neutral: "#F6F2EE",
    canvas: "#FDFBF7",
    panel: "#F6F2EE",
    signalRed: "#D94F63",
    borderGray: "#B8B0A8",
    medGray: "#8A8279",
    slate: "#4A4540",
    fontFamily: "Trebuchet MS, Arial, sans-serif",
    fontSize: "14px",
  },
  corporate: {
    name: "Corporate Neutral",
    primaryDark: "#1A1A2E",
    primaryMedium: "#16213E",
    primaryDeep: "#0F3460",
    accent: "#E94560",
    supportMed: "#D4E4F7",
    supportLight: "#EDF2F7",
    neutral: "#E2E8F0",
    canvas: "#F7FAFC",
    panel: "#EDF2F7",
    signalRed: "#E94560",
    borderGray: "#A0AEC0",
    medGray: "#718096",
    slate: "#4A5568",
    fontFamily: "Segoe UI, Arial, sans-serif",
    fontSize: "14px",
  },
};

function ColorInput({ label, value, onChange, description }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 32, height: 32, border: "none", padding: 0, cursor: "pointer", borderRadius: 4 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.3 }}>{description}</div>
        )}
      </div>
      <input
        type="text"
        value={value.toUpperCase()}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v);
        }}
        style={{
          width: 76,
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          textAlign: "center",
          padding: "4px 6px",
        }}
      />
    </div>
  );
}

function NodePreview({ fill, stroke, textColor, label, dashed, strokeWidth = 1.5 }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 14px",
        background: fill,
        border: `${strokeWidth}px ${dashed ? "dashed" : "solid"} ${stroke}`,
        borderRadius: 4,
        color: textColor,
        fontSize: 11,
        fontWeight: 500,
        minWidth: 80,
        textAlign: "center",
      }}
    >
      {label}
    </div>
  );
}

function CopyBlock({ title, content }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{title}</span>
        <button onClick={handleCopy} style={{ fontSize: 12, padding: "3px 10px", cursor: "pointer" }}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)",
          padding: "10px 12px",
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          lineHeight: 1.5,
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          maxHeight: 260,
          margin: 0,
          color: "var(--color-text-primary)",
        }}
      >
        {content}
      </pre>
    </div>
  );
}

export default function MermaidThemeRoller() {
  const [colors, setColors] = useState(PRESETS.bfs);
  const [activePreset, setActivePreset] = useState("bfs");
  const [activeTab, setActiveTab] = useState("preview");

  const setColor = useCallback((key, value) => {
    setColors((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null);
  }, []);

  const applyPreset = useCallback((key) => {
    setColors(PRESETS[key]);
    setActivePreset(key);
  }, []);

  const yamlBlock = useMemo(() => {
    return `---
config:
  theme: base
  look: classic
  themeVariables:
    background: "${colors.canvas}"
    fontFamily: "${colors.fontFamily}"
    fontSize: "${colors.fontSize}"
    textColor: "#333333"
    lineColor: "${colors.primaryDeep}"
    clusterBorder: "${colors.primaryDeep}"
    titleColor: "${colors.primaryDark}"
    primaryColor: "#FFFFFF"
    primaryBorderColor: "${colors.borderGray}"
    primaryTextColor: "#333333"
    secondaryColor: "${colors.supportMed}"
    secondaryBorderColor: "${colors.primaryDark}"
    secondaryTextColor: "${textColorFor(colors.supportMed) === "#333333" ? colors.primaryDark : "#FFFFFF"}"
    tertiaryColor: "${colors.canvas}"
    tertiaryBorderColor: "${colors.medGray}"
    tertiaryTextColor: "${textColorFor(colors.canvas) === "#333333" ? "#4D4D4D" : "#E5E5E5"}"
    edgeLabelBackground: "#FFFFFF"
    clusterBkg: "${colors.panel}"
    mainBkg: "#FFFFFF"
    nodeBorder: "${colors.borderGray}"
    nodeTextColor: "#333333"
    noteBkgColor: "${colors.supportLight}"
    noteTextColor: "${colors.primaryDark}"
    noteBorderColor: "${colors.primaryMedium}"
    actorBkg: "#FFFFFF"
    actorBorder: "${colors.primaryDark}"
    actorTextColor: "${colors.primaryDark}"
    signalColor: "#333333"
    labelBoxBkgColor: "${colors.supportMed}"
    labelBoxBorderColor: "${colors.primaryDark}"
---`;
  }, [colors]);

  const initBlock = useMemo(() => {
    return `%%{init: {"theme":"base","themeVariables":{"background":"${colors.canvas}","fontFamily":"${colors.fontFamily}","fontSize":"${colors.fontSize}","textColor":"#333333","lineColor":"${colors.primaryDeep}","clusterBorder":"${colors.primaryDeep}","titleColor":"${colors.primaryDark}","primaryColor":"#FFFFFF","primaryBorderColor":"${colors.borderGray}","primaryTextColor":"#333333","secondaryColor":"${colors.supportMed}","secondaryBorderColor":"${colors.primaryDark}","tertiaryColor":"${colors.canvas}","tertiaryBorderColor":"${colors.medGray}","edgeLabelBackground":"#FFFFFF","clusterBkg":"${colors.panel}","mainBkg":"#FFFFFF","nodeBorder":"${colors.borderGray}","nodeTextColor":"#333333"}}}%%`;
  }, [colors]);

  const classDefBlock = useMemo(() => {
    const tc = (bg) => textColorFor(bg);
    return `classDef primary     fill:${colors.neutral},stroke:${colors.primaryDark},stroke-width:1.5px,color:${tc(colors.neutral) === "#333333" ? "#4D4D4D" : "#FFFFFF"}
classDef secondary   fill:${colors.supportMed},stroke:${colors.primaryDark},stroke-width:1.5px,color:${tc(colors.supportMed) === "#333333" ? colors.primaryDark : "#FFFFFF"}
classDef tertiary    fill:${colors.supportLight},stroke:${colors.primaryMedium},stroke-width:1.5px,color:${tc(colors.supportLight) === "#333333" ? colors.primaryDark : "#FFFFFF"}
classDef platform    fill:#FFFFFF,stroke:${colors.primaryDark},stroke-width:1.5px,color:#4D4D4D
classDef boundary    fill:${colors.neutral},stroke:${colors.medGray},stroke-width:1.5px,color:${tc(colors.neutral) === "#333333" ? "#4D4D4D" : "#CCCCCC"}
classDef actor       fill:#FFFFFF,stroke:${colors.primaryDark},stroke-width:1.5px,color:${colors.primaryDark}
classDef gate        fill:#FFFFFF,stroke:${colors.borderGray},stroke-width:1px,stroke-dasharray:4 3,color:#4D4D4D
classDef control     fill:#FFFFFF,stroke:${colors.borderGray},stroke-width:1px,color:#4D4D4D
classDef log         fill:#FFFFFF,stroke:${colors.borderGray},stroke-width:1px,color:#4D4D4D
classDef question    fill:#FFFFFF,stroke:${colors.primaryDark},stroke-width:1px,stroke-dasharray:6 4,color:${colors.primaryDark}
classDef accent      fill:${colors.accent},stroke:${darken(colors.accent)},stroke-width:1.4px,color:${textColorFor(colors.accent)}
classDef deepBlue    fill:${colors.primaryDeep},stroke:${colors.primaryDeep},stroke-width:1.4px,color:#FFFFFF
classDef slate       fill:${colors.slate},stroke:${darken(colors.slate)},stroke-width:1.4px,color:#FFFFFF
classDef dbStrong    stroke-width:1.8px
classDef scope       fill:${colors.supportLight},stroke:${colors.primaryDark},stroke-width:2px,color:${tc(colors.supportLight) === "#333333" ? colors.primaryDark : "#FFFFFF"}
classDef outOfScope  fill:#FFFFFF,stroke:${colors.signalRed},stroke-width:2px,color:${colors.signalRed}
classDef redDash     fill:${colors.signalRed},stroke:${darken(colors.signalRed)},stroke-dasharray:3 2,stroke-width:1.5px,color:#FFFFFF

linkStyle default stroke:${colors.primaryDeep},stroke-width:1.3px`;
  }, [colors]);

  const subgraphBlock = useMemo(() => {
    return `Tier 1 (major boundary):
  style ID fill:${colors.neutral},stroke:${colors.primaryDark},stroke-width:2px,color:${textColorFor(colors.neutral) === "#333333" ? "#4D4D4D" : "#CCCCCC"}

Tier 2 (system tenant):
  style ID fill:${colors.supportMed},stroke:${colors.primaryDark},stroke-width:2px,color:${textColorFor(colors.supportMed) === "#333333" ? colors.primaryDark : "#FFFFFF"}

Tier 2b (light system):
  style ID fill:${colors.supportLight},stroke:${colors.primaryMedium},stroke-width:2px,color:${textColorFor(colors.supportLight) === "#333333" ? colors.primaryDark : "#FFFFFF"}

Tier 3 (interior group):
  style ID fill:${colors.neutral},stroke:${colors.medGray},stroke-width:2px,color:${textColorFor(colors.neutral) === "#333333" ? "#4D4D4D" : "#CCCCCC"}

Tier 3b (chrome group):
  style ID fill:#FFFFFF,stroke:${colors.borderGray},stroke-width:2px,color:#4D4D4D

Tier 4 (environment panel):
  style ID fill:${colors.panel},stroke:${colors.primaryDeep},stroke-width:1.5px,color:${textColorFor(colors.panel) === "#333333" ? colors.primaryDeep : "#FFFFFF"}`;
  }, [colors]);

  const tabs = [
    { id: "preview", label: "Preview" },
    { id: "yaml", label: "YAML frontmatter" },
    { id: "init", label: "Init directive" },
    { id: "classdef", label: "classDef library" },
    { id: "subgraph", label: "Subgraph tiers" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 680 }}>
      <h2 className="sr-only">Mermaid ThemeRoller: configure brand colors and generate Mermaid styling code</h2>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              cursor: "pointer",
              fontWeight: activePreset === key ? 500 : 400,
              background: activePreset === key ? "var(--color-background-info)" : undefined,
              color: activePreset === key ? "var(--color-text-info)" : undefined,
              borderColor: activePreset === key ? "var(--color-border-info)" : undefined,
            }}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Brand blues
          </div>
          <ColorInput label="Primary dark" value={colors.primaryDark} onChange={(v) => setColor("primaryDark", v)} description="Brand anchor, borders, titles" />
          <ColorInput label="Primary medium" value={colors.primaryMedium} onChange={(v) => setColor("primaryMedium", v)} description="Secondary strokes" />
          <ColorInput label="Primary deep" value={colors.primaryDeep} onChange={(v) => setColor("primaryDeep", v)} description="Edge lines, cluster borders" />
          <ColorInput label="Accent" value={colors.accent} onChange={(v) => setColor("accent", v)} description="Highlight nodes (sparse)" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Fills and surfaces
          </div>
          <ColorInput label="Support medium" value={colors.supportMed} onChange={(v) => setColor("supportMed", v)} description="System/app fills" />
          <ColorInput label="Support light" value={colors.supportLight} onChange={(v) => setColor("supportLight", v)} description="AI/overlay/scope fills" />
          <ColorInput label="Neutral gray" value={colors.neutral} onChange={(v) => setColor("neutral", v)} description="Context fills, boundaries" />
          <ColorInput label="Canvas" value={colors.canvas} onChange={(v) => setColor("canvas", v)} description="Diagram background" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Chrome and signals
          </div>
          <ColorInput label="Panel gray" value={colors.panel} onChange={(v) => setColor("panel", v)} description="Cluster interior" />
          <ColorInput label="Border gray" value={colors.borderGray} onChange={(v) => setColor("borderGray", v)} description="Gate/control borders" />
          <ColorInput label="Medium gray" value={colors.medGray} onChange={(v) => setColor("medGray", v)} description="Boundary strokes" />
          <ColorInput label="Slate" value={colors.slate} onChange={(v) => setColor("slate", v)} description="Dark infrastructure" />
          <ColorInput label="Signal red" value={colors.signalRed} onChange={(v) => setColor("signalRed", v)} description="Warning/exclusion" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Typography
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 2 }}>Font family</div>
            <input
              type="text"
              value={colors.fontFamily}
              onChange={(e) => setColor("fontFamily", e.target.value)}
              style={{ width: "100%", fontSize: 12, fontFamily: "var(--font-mono)", padding: "6px 8px" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 2 }}>Font size</div>
            <input
              type="text"
              value={colors.fontSize}
              onChange={(e) => setColor("fontSize", e.target.value)}
              style={{ width: 80, fontSize: 12, fontFamily: "var(--font-mono)", padding: "6px 8px" }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid var(--color-border-tertiary)", marginBottom: 12 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontSize: 12,
              padding: "6px 12px",
              cursor: "pointer",
              border: "none",
              borderBottom: activeTab === tab.id ? `2px solid var(--color-text-primary)` : "2px solid transparent",
              background: "transparent",
              color: activeTab === tab.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontWeight: activeTab === tab.id ? 500 : 400,
              borderRadius: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "preview" && (
        <div>
          <div style={{ background: colors.canvas, borderRadius: "var(--border-radius-lg)", padding: 16, marginBottom: 12, border: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 10 }}>Node class preview on canvas</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <NodePreview fill={colors.neutral} stroke={colors.primaryDark} textColor={textColorFor(colors.neutral) === "#333333" ? "#4D4D4D" : "#FFFFFF"} label="primary" />
              <NodePreview fill={colors.supportMed} stroke={colors.primaryDark} textColor={textColorFor(colors.supportMed) === "#333333" ? colors.primaryDark : "#FFFFFF"} label="secondary" />
              <NodePreview fill={colors.supportLight} stroke={colors.primaryMedium} textColor={textColorFor(colors.supportLight) === "#333333" ? colors.primaryDark : "#FFFFFF"} label="tertiary" />
              <NodePreview fill="#FFFFFF" stroke={colors.primaryDark} textColor="#4D4D4D" label="platform" />
              <NodePreview fill="#FFFFFF" stroke={colors.primaryDark} textColor={colors.primaryDark} label="actor" />
              <NodePreview fill={colors.neutral} stroke={colors.medGray} textColor={textColorFor(colors.neutral) === "#333333" ? "#4D4D4D" : "#CCCCCC"} label="boundary" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              <NodePreview fill="#FFFFFF" stroke={colors.borderGray} textColor="#4D4D4D" label="gate" dashed strokeWidth={1} />
              <NodePreview fill="#FFFFFF" stroke={colors.borderGray} textColor="#4D4D4D" label="control" strokeWidth={1} />
              <NodePreview fill="#FFFFFF" stroke={colors.borderGray} textColor="#4D4D4D" label="log" strokeWidth={1} />
              <NodePreview fill="#FFFFFF" stroke={colors.primaryDark} textColor={colors.primaryDark} label="question" dashed strokeWidth={1} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              <NodePreview fill={colors.accent} stroke={darken(colors.accent)} textColor={textColorFor(colors.accent)} label="accent" strokeWidth={1.4} />
              <NodePreview fill={colors.primaryDeep} stroke={colors.primaryDeep} textColor="#FFFFFF" label="deepBlue" strokeWidth={1.4} />
              <NodePreview fill={colors.slate} stroke={darken(colors.slate)} textColor="#FFFFFF" label="slate" strokeWidth={1.4} />
              <NodePreview fill={colors.supportLight} stroke={colors.primaryDark} textColor={textColorFor(colors.supportLight) === "#333333" ? colors.primaryDark : "#FFFFFF"} label="scope" strokeWidth={2} />
              <NodePreview fill="#FFFFFF" stroke={colors.signalRed} textColor={colors.signalRed} label="outOfScope" strokeWidth={2} />
              <NodePreview fill={colors.signalRed} stroke={darken(colors.signalRed)} textColor="#FFFFFF" label="redDash" dashed />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 140, background: colors.neutral, border: `2px solid ${colors.primaryDark}`, borderRadius: 6, padding: "8px 10px", fontSize: 11, color: textColorFor(colors.neutral) === "#333333" ? "#4D4D4D" : "#CCCCCC" }}>
              Tier 1 subgraph
            </div>
            <div style={{ flex: 1, minWidth: 140, background: colors.supportMed, border: `2px solid ${colors.primaryDark}`, borderRadius: 6, padding: "8px 10px", fontSize: 11, color: textColorFor(colors.supportMed) === "#333333" ? colors.primaryDark : "#FFFFFF" }}>
              Tier 2 subgraph
            </div>
            <div style={{ flex: 1, minWidth: 140, background: colors.panel, border: `1.5px solid ${colors.primaryDeep}`, borderRadius: 6, padding: "8px 10px", fontSize: 11, color: textColorFor(colors.panel) === "#333333" ? colors.primaryDeep : "#FFFFFF" }}>
              Tier 4 subgraph
            </div>
          </div>
        </div>
      )}

      {activeTab === "yaml" && <CopyBlock title="YAML frontmatter" content={yamlBlock} />}
      {activeTab === "init" && <CopyBlock title="Init directive (single line, Loop fallback)" content={initBlock} />}
      {activeTab === "classdef" && <CopyBlock title="classDef library + linkStyle" content={classDefBlock} />}
      {activeTab === "subgraph" && <CopyBlock title="Subgraph style tiers" content={subgraphBlock} />}
    </div>
  );
}
