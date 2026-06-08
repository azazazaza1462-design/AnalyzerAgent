import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  // Optional tonal accent for non-active chips that surface attention-worthy
  // counts (failed jobs, divergences, etc.). Active state always uses the
  // primary fill so the selection is unambiguous.
  tone?: "neutral" | "danger" | "warning" | "info";
}

const TONE_COUNT_COLOR: Record<NonNullable<FilterChipProps["tone"]>, string> = {
  neutral: "text-ew-text-tertiary",
  danger: "text-ew-danger-text",
  warning: "text-ew-warning-text",
  info: "text-ew-info-text",
};

export function FilterChip({
  label,
  count,
  active,
  onClick,
  tone = "neutral",
}: FilterChipProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border-[0.5px] px-2.5 py-1 text-[12px] font-medium transition-colors",
        active
          ? "border-ew-text-primary bg-ew-text-primary text-ew-bg-primary"
          : "border-ew-border bg-ew-bg-secondary text-ew-text-secondary hover:border-ew-border-strong hover:text-ew-text-primary",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          active
            ? "text-ew-bg-primary/70"
            : count > 0
              ? TONE_COUNT_COLOR[tone]
              : "text-ew-text-tertiary",
        )}
      >
        {count}
      </span>
    </button>
  );
}
