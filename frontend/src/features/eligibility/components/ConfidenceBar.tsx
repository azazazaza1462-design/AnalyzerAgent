import { cn } from "@/lib/utils";
import type { Verdict } from "../types";

interface ConfidenceBarProps {
  value: number;
  verdict?: Verdict;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

// Verdict drives the fill color so confidence reads as confidence *in this
// verdict*, not a context-free meter.
const FILL_BY_VERDICT: Record<Verdict, string> = {
  eligible: "bg-ew-success-text",
  conditional: "bg-ew-warning-text",
  ineligible: "bg-ew-danger-text",
  pending: "bg-ew-text-tertiary",
};

export function ConfidenceBar({
  value,
  verdict = "eligible",
  size = "md",
  showLabel = true,
  className,
}: ConfidenceBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const height = size === "sm" ? "h-1" : size === "md" ? "h-1.5" : "h-2";
  const labelSize = size === "lg" ? "text-[22px]" : "text-[14px]";

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-baseline justify-between">
          <span className={cn("font-medium tabular-nums text-ew-text-primary", labelSize)}>
            {Math.round(pct)}%
          </span>
          <span className="text-[12px] text-ew-text-tertiary">confidence</span>
        </div>
      )}
      <div
        className={cn("w-full rounded-full bg-ew-bg-secondary", height)}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width]", FILL_BY_VERDICT[verdict])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
