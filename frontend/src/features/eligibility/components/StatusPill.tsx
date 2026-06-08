import { cn } from "@/lib/utils";
import type { DimResult, Verdict } from "../types";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-ew-success-bg text-ew-success-text",
  warning: "bg-ew-warning-bg text-ew-warning-text",
  danger: "bg-ew-danger-bg text-ew-danger-text",
  info: "bg-ew-info-bg text-ew-info-text",
  neutral: "bg-ew-neutral-bg text-ew-neutral-text",
};

const VERDICT_TONE: Record<Verdict, Tone> = {
  eligible: "success",
  conditional: "warning",
  ineligible: "danger",
  pending: "neutral",
};

const VERDICT_LABEL: Record<Verdict, string> = {
  eligible: "Eligible",
  conditional: "Conditional",
  ineligible: "Ineligible",
  pending: "Pending",
};

const DIM_TONE: Record<DimResult, Tone> = {
  pass: "success",
  borderline: "warning",
  fail: "danger",
};

const DIM_LABEL: Record<DimResult, string> = {
  pass: "Pass",
  borderline: "Borderline",
  fail: "Fail",
};

interface BaseProps {
  size?: "sm" | "md";
  className?: string;
}

export function VerdictPill({
  verdict,
  size = "sm",
  className,
}: BaseProps & { verdict: Verdict }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium",
        size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-2.5 py-1 text-[14px]",
        TONE_CLASSES[VERDICT_TONE[verdict]],
        className,
      )}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

export function DimResultPill({
  result,
  size = "sm",
  className,
}: BaseProps & { result: DimResult }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium",
        size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-2.5 py-1 text-[14px]",
        TONE_CLASSES[DIM_TONE[result]],
        className,
      )}
    >
      {DIM_LABEL[result]}
    </span>
  );
}

// Generic tone-driven pill for one-off labels (e.g., "Custom model v2.3" badge,
// "In production", etc.). Use VerdictPill/DimResultPill for the typed cases.
export function StatusPill({
  tone,
  children,
  size = "sm",
  className,
}: BaseProps & { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium",
        size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-2.5 py-1 text-[14px]",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
