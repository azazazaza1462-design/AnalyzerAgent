import { cn } from "@/lib/utils";
import type { ModelMode } from "../types";

const MODE_LABEL: Record<ModelMode, string> = {
  parallel_signal: "Parallel signal",
  fallback: "Fallback",
  validation_layer: "Validation layer",
};

interface ModeBadgeProps {
  mode: ModelMode;
  className?: string;
}

// Renders "Mode: …" — the brief calls this out as a badge on the verdict card.
// Kept separate from StatusPill because semantics matter: this is a label
// describing how the model is wired into the workflow, not a state.
export function ModeBadge({ mode, className }: ModeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary px-2 py-0.5 text-[12px] text-ew-text-secondary",
        className,
      )}
    >
      <span className="text-ew-text-tertiary">Mode:</span>
      <span className="font-medium text-ew-text-primary">{MODE_LABEL[mode]}</span>
    </span>
  );
}
