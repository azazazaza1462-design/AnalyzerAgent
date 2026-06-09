import { Check, Split } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParityStatus } from "../types";

interface ParityIconProps {
  status: ParityStatus;
  className?: string;
}

// Inline icon used in queue rows and headers — check for agreement, split for
// divergence. Pending shows nothing so the row doesn't claim certainty it
// doesn't have.
export function ParityIcon({ status, className }: ParityIconProps) {
  if (status === "agreement") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[12px] text-ew-success-text",
          className,
        )}
        aria-label="Parity: agreement"
        title="Agreement with rules engine"
      >
        <Check className="size-3.5" />
        <span>Agreement</span>
      </span>
    );
  }
  if (status === "divergence") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[12px] text-ew-warning-text",
          className,
        )}
        aria-label="Parity: divergence"
        title="Divergence with rules engine"
      >
        <Split className="size-3.5" />
        <span>Divergence</span>
      </span>
    );
  }
  return null;
}
