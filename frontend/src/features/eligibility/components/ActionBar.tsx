import { Link } from "react-router";
import { ArrowRight, Check, Cpu, RefreshCw, Split } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModelMode } from "../types";

interface ActionBarProps {
  mode: ModelMode;
  canOverride: boolean;
  alreadyDecided: boolean;
  hasDivergence: boolean;
  // Optional "next application" link, surfaced once the underwriter has
  // resolved the current case so they can stay in the queue without
  // round-tripping through the sidebar.
  nextHref?: string;
  remainingInQueue?: number;
  onAccept: () => void;
  onOverride: () => void;
  onRerun: () => void;
  onExplain?: () => void;
}

// Sticky bottom strip with the actions for this assessment. Action set varies
// by ModelMode — parallel_signal (default) gives the human full arbitration,
// while fallback/validation_layer constrain options (TODO: implement when
// those modes are exercised).
export function ActionBar({
  mode,
  canOverride,
  alreadyDecided,
  hasDivergence,
  nextHref,
  remainingInQueue,
  onAccept,
  onOverride,
  onRerun,
  onExplain,
}: ActionBarProps) {
  const acceptLabel =
    mode === "parallel_signal"
      ? "Accept finding"
      : mode === "fallback"
        ? "Confirm fallback"
        : "Acknowledge validation";

  return (
    <div className="sticky bottom-0 -mx-8 mt-12 border-t-[0.5px] border-ew-border bg-ew-bg-primary px-8 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] text-ew-text-tertiary">
          {alreadyDecided && (
            <>
              <Check className="size-3.5 text-ew-success-text" />
              <span>Decision recorded for this run.</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {alreadyDecided ? (
            nextHref ? (
              <Link
                to={nextHref}
                className="inline-flex items-center rounded-md bg-ew-text-primary px-3 py-1.5 text-[14px] font-medium text-ew-bg-primary transition-opacity hover:opacity-90"
              >
                Next application
                {typeof remainingInQueue === "number" && remainingInQueue > 0 && (
                  <span className="ml-1.5 text-ew-bg-primary/70">
                    ({remainingInQueue})
                  </span>
                )}
                <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            ) : (
              <Link
                to="/underwriting/queue"
                className="inline-flex items-center rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary px-3 py-1.5 text-[14px] font-medium text-ew-text-primary transition-colors hover:border-ew-border-strong"
              >
                Back to queue
              </Link>
            )
          ) : (
            <>
              {hasDivergence && onExplain && (
                <ActionButton onClick={onExplain} variant="ghost">
                  <Split className="mr-1.5 size-3.5" />
                  Explain divergence
                </ActionButton>
              )}
              <ActionButton onClick={onRerun} variant="ghost">
                <RefreshCw className="mr-1.5 size-3.5" />
                Re-run model
              </ActionButton>
              {canOverride && (
                <ActionButton onClick={onOverride} variant="secondary">
                  Override
                </ActionButton>
              )}
              <ActionButton onClick={onAccept} variant="primary">
                <Cpu className="mr-1.5 size-3.5" />
                {acceptLabel}
              </ActionButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors",
        variant === "primary" &&
          "bg-ew-text-primary text-ew-bg-primary hover:opacity-90",
        variant === "secondary" &&
          "border-[0.5px] border-ew-border bg-ew-bg-secondary text-ew-text-primary hover:border-ew-border-strong",
        variant === "ghost" && "text-ew-text-secondary hover:text-ew-text-primary",
      )}
    >
      {children}
    </button>
  );
}
