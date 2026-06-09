import { cn } from "@/lib/utils";

interface Segment {
  key: string;
  value: number;
  // Tailwind class — uses the same `--ew-*` token surfaces as everything
  // else. Pass `bg-ew-success-text`, `bg-ew-warning-text`, etc.
  className: string;
  label?: string;
}

interface StackedBarProps {
  segments: Segment[];
  height?: "sm" | "md";
  className?: string;
}

// Horizontal bar that visualises the proportional distribution of a set of
// statuses (or any keyed counts). Segments share a 0.5px gap so they read as
// distinct units even when adjacent colors are similar.
export function StackedBar({ segments, height = "md", className }: StackedBarProps) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  if (total === 0) {
    return (
      <div
        className={cn(
          "w-full rounded-full bg-ew-bg-secondary",
          height === "sm" ? "h-1.5" : "h-2",
          className,
        )}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={segments
        .filter((s) => s.value > 0)
        .map((s) => `${s.label ?? s.key}: ${s.value}`)
        .join(", ")}
      className={cn(
        "flex w-full overflow-hidden rounded-full bg-ew-bg-secondary",
        height === "sm" ? "h-1.5" : "h-2",
        className,
      )}
    >
      {segments.map((seg) => {
        if (seg.value === 0) return null;
        const pct = (seg.value / total) * 100;
        return (
          <div
            key={seg.key}
            className={cn("h-full first:rounded-l-full last:rounded-r-full", seg.className)}
            style={{ width: `${pct}%` }}
            title={`${seg.label ?? seg.key}: ${seg.value}`}
          />
        );
      })}
    </div>
  );
}
