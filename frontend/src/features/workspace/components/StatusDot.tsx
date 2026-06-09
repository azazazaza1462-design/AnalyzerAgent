import { cn } from "@/lib/utils";
import { statusLabel } from "../labels";
import type { JobStatus } from "../types";

// Minimal status indicator: a colored dot + label. The dot itself reads as the
// state at a glance; the label is for screen readers and confirmation.
const DOT_TONE: Record<JobStatus, string> = {
  completed: "bg-ew-success-text",
  in_progress: "bg-ew-info-text",
  pending: "bg-ew-warning-text",
  failed: "bg-ew-danger-text",
  cancelled: "bg-ew-neutral-text",
};

interface StatusDotProps {
  status: JobStatus;
  showLabel?: boolean;
  className?: string;
}

export function StatusDot({ status, showLabel = true, className }: StatusDotProps) {
  // Active states get a soft pulse so an underwriter scanning a long list can
  // tell at a glance which rows are still moving.
  const pulsing = status === "in_progress" || status === "pending";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-[12px] text-ew-text-secondary", className)}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          DOT_TONE[status],
          pulsing && "animate-pulse",
        )}
      />
      {showLabel && <span>{statusLabel(status)}</span>}
    </span>
  );
}
