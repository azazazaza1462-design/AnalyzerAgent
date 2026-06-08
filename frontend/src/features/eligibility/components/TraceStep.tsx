import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TraceStepProps {
  index: number;
  title: string;
  caption?: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "active" | "muted";
  isLast?: boolean;
  className?: string;
}

const NODE_VARIANTS: Record<NonNullable<TraceStepProps["variant"]>, string> = {
  default: "border-ew-border bg-ew-bg-primary text-ew-text-secondary",
  active: "border-ew-info-text/40 bg-ew-info-bg text-ew-info-text",
  muted: "border-ew-border bg-ew-bg-secondary text-ew-text-tertiary",
};

// One node in the provenance chain: Source document → Extracted value → Model
// feature → Finding. Renders a circle (icon or numeric index) with the
// vertical connector to the next step. `isLast` suppresses the connector.
export function TraceStep({
  index,
  title,
  caption,
  icon,
  variant = "default",
  isLast = false,
  className,
}: TraceStepProps) {
  return (
    <div className={cn("relative flex gap-4 pb-6 last:pb-0", className)}>
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[19px] top-10 -bottom-0 w-px bg-ew-border"
        />
      )}
      <div
        className={cn(
          "relative flex size-10 shrink-0 items-center justify-center rounded-full border-[0.5px]",
          NODE_VARIANTS[variant],
        )}
      >
        {icon ?? (
          <span className="text-[12px] font-medium text-ew-text-secondary">{index}</span>
        )}
      </div>
      <div className="min-w-0 pt-1.5">
        <div className="text-[14px] font-medium text-ew-text-primary">{title}</div>
        {caption && (
          <div className="mt-0.5 text-[12px] text-ew-text-secondary">{caption}</div>
        )}
      </div>
    </div>
  );
}
