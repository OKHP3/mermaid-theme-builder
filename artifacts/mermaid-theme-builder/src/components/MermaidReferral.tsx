/**
 * Affiliate / referral CTA shown once per page that embeds a live Mermaid
 * diagram. The "Mermaid.AI" wordmark uses the official Mermaid hot-pink
 * brand colour (#FF3670). The href is Jamie's paid referral link.
 */
const MERMAID_PINK = "#FF3670";
const REFERRAL_HREF = "https://mermaidchart.cello.so/UhVlNtC2MlS";

interface MermaidReferralProps {
  /** Which Mermaid surface to name in the link text. */
  variant?: "ai" | "chart" | "live";
  className?: string;
}

const LABELS: Record<NonNullable<MermaidReferralProps["variant"]>, string> = {
  ai: "Mermaid.AI",
  chart: "Mermaid.Chart",
  live: "Mermaid.Live",
};

export function MermaidReferral({ variant = "ai", className = "" }: MermaidReferralProps) {
  const label = LABELS[variant];
  return (
    <p
      className={`text-[11px] text-muted-foreground leading-relaxed print-hide ${className}`}
    >
      Try{" "}
      <a
        href={REFERRAL_HREF}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="font-semibold underline decoration-dotted underline-offset-2 hover:decoration-solid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded-sm"
        style={{ color: MERMAID_PINK, outlineColor: MERMAID_PINK }}
      >
        {label} →
      </a>{" "}
      if you want to explore the syntax yourself.
    </p>
  );
}
