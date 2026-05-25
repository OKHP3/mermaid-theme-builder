import type { Palette } from "./palettes";
import type { DiagramFamily } from "./detector";

function pick(palette: Palette, key: string, fallback: string): string {
  return palette.colors.find((c) => c.key === key)?.value ?? fallback;
}

/**
 * Per-family themeVariables overlays.
 *
 * Mermaid's `themeVariables` set varies by diagram family. The base palette
 * exposes only the universal flowchart-centric tokens; this function maps
 * those tokens to the additional family-specific variables Mermaid honors,
 * so a sequence/state/ER/class/gantt diagram looks intentional rather than
 * accidentally mixed with default Mermaid colors.
 *
 * All keys here are documented Mermaid theme variables. See:
 *   https://mermaid.js.org/config/theming.html
 */
export function familyThemeOverlay(
  palette: Palette,
  family: DiagramFamily
): Record<string, string> {
  const primary = pick(palette, "primaryColor", "#1f2937");
  const primaryText = pick(palette, "primaryTextColor", "#ffffff");
  const primaryBorder = pick(palette, "primaryBorderColor", "#6b7280");
  const secondary = pick(palette, "secondaryColor", "#374151");
  const tertiary = pick(palette, "tertiaryColor", "#e5e7eb");
  const background = pick(palette, "background", "#ffffff");
  const mainBkg = pick(palette, "mainBkg", "#f3f4f6");
  const nodeBorder = pick(palette, "nodeBorder", "#6b7280");
  const lineColor = pick(palette, "lineColor", "#6b7280");
  const titleColor = pick(palette, "titleColor", "#111827");
  const clusterBkg = pick(palette, "clusterBkg", "#f9fafb");

  switch (family) {
    case "sequenceDiagram":
      return {
        actorBkg: primary,
        actorBorder: primaryBorder,
        actorTextColor: primaryText,
        actorLineColor: lineColor,
        signalColor: lineColor,
        signalTextColor: titleColor,
        labelBoxBkgColor: secondary,
        labelBoxBorderColor: primaryBorder,
        labelTextColor: primaryText,
        loopTextColor: titleColor,
        noteBkgColor: tertiary,
        noteBorderColor: primaryBorder,
        noteTextColor: titleColor,
        activationBkgColor: secondary,
        activationBorderColor: primaryBorder,
        sequenceNumberColor: primaryText,
      };

    case "stateDiagram":
      return {
        labelColor: titleColor,
        altBackground: secondary,
        compositeBackground: clusterBkg,
        compositeBorder: primaryBorder,
        compositeTitleBackground: primary,
        innerEndBackground: nodeBorder,
        specialStateColor: lineColor,
        transitionColor: lineColor,
        transitionLabelColor: titleColor,
        stateLabelColor: titleColor,
        stateBkg: primary,
        labelBackgroundColor: background,
      };

    case "erDiagram":
      return {
        attributeBackgroundColorOdd: mainBkg,
        attributeBackgroundColorEven: tertiary,
        entityFill: primary,
        entityBorder: primaryBorder,
        entityLabelColor: primaryText,
        relationColor: lineColor,
        relationLabelBackground: background,
        relationLabelColor: titleColor,
      };

    case "classDiagram":
      return {
        classText: primaryText,
        classBorder: primaryBorder,
        relationColor: lineColor,
        relationLabelColor: titleColor,
      };

    case "gantt":
      return {
        sectionBkgColor: mainBkg,
        altSectionBkgColor: tertiary,
        sectionBkgColor2: secondary,
        taskBkgColor: primary,
        taskTextColor: primaryText,
        taskTextLightColor: primaryText,
        taskTextOutsideColor: titleColor,
        taskTextDarkColor: titleColor,
        activeTaskBkgColor: secondary,
        activeTaskBorderColor: primaryBorder,
        doneTaskBkgColor: tertiary,
        doneTaskBorderColor: primaryBorder,
        critBkgColor: "#dc2626",
        critBorderColor: "#7f1d1d",
        gridColor: lineColor,
        todayLineColor: lineColor,
        excludeBkgColor: tertiary,
      };

    case "journey":
      return {
        sectionBkgColor: mainBkg,
        altSectionBkgColor: tertiary,
        taskBkgColor: primary,
        taskTextColor: primaryText,
        labelColor: titleColor,
      };

    case "pie":
      return {
        pie1: primary,
        pie2: secondary,
        pie3: tertiary,
        pie4: lineColor,
        pie5: nodeBorder,
        pieTitleTextColor: titleColor,
        pieSectionTextColor: primaryText,
        pieLegendTextColor: titleColor,
      };

    case "gitGraph":
      return {
        git0: primary,
        git1: secondary,
        git2: lineColor,
        git3: nodeBorder,
        gitBranchLabel0: primaryText,
        gitBranchLabel1: primaryText,
        commitLabelColor: titleColor,
        commitLabelBackground: background,
      };

    case "quadrantChart":
      return {
        quadrant1Fill: primary,
        quadrant2Fill: secondary,
        quadrant3Fill: tertiary,
        quadrant4Fill: mainBkg,
        quadrantTitleFill: titleColor,
        quadrantPointFill: lineColor,
        quadrantPointTextFill: primaryText,
      };

    case "timeline":
      // cScale0–cScale11 are the documented Mermaid themeVariables for timeline section coloring.
      // They cycle through the palette: primary → secondary → tertiary → accent tones, repeating.
      return {
        cScale0: primary,
        cScale1: secondary,
        cScale2: tertiary,
        cScale3: lineColor,
        cScale4: nodeBorder,
        cScale5: clusterBkg,
        cScale6: mainBkg,
        cScale7: primary,
        cScale8: secondary,
        cScale9: tertiary,
        cScale10: lineColor,
        cScale11: nodeBorder,
      };

    case "xychart":
      // XY chart series colors are controlled by config.xyChart.plotColorPalette (not themeVariables).
      // The variables below are the standard themeVariables most relevant to XY chart rendering:
      // background, axis label text, title, and plot border colors all respond to these keys.
      return {
        xyChart: [primary, secondary, tertiary, lineColor, nodeBorder, mainBkg].join(","),
      };

    case "block":
      // block-beta uses the same themeVariable keys as flowchart — no unique
      // vars exist. Returning an explicit set ensures the node fill, border,
      // and connector colors from the palette are applied even when Mermaid's
      // default theme differs from the selected palette's base values.
      return {
        mainBkg: mainBkg,
        nodeBorder: nodeBorder,
        lineColor: lineColor,
        clusterBkg: clusterBkg,
        titleColor: titleColor,
      };

    case "c4Diagram":
      // C4 diagrams have partial themeVariable support. personBkg and
      // personBorder are the only C4-specific themeVariables (used for Person
      // and Person_Ext shapes). System and boundary shapes fall back to the
      // standard mainBkg/nodeBorder/lineColor keys, which are also set here.
      return {
        personBkg: primary,
        personBorder: primaryBorder,
        mainBkg: mainBkg,
        nodeBorder: nodeBorder,
        lineColor: lineColor,
        titleColor: titleColor,
      };

    case "flowchart":
    case "mindmap":
    case "requirementDiagram":
    case "architectureBeta":
    case "sankey":
    case "packet":
    case "kanban":
    case "treemap":
    case "venn":
    case "ishikawa":
    case "wardley":
    case "treeView":
    case "zenuml":
    case "radar":
    case "eventModeling":
    case "unknown":
    default:
      return {};
  }
}
