import { useId } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  // Optional last-point emphasis (filled dot at the right edge).
  showLastPoint?: boolean;
  className?: string;
}

// Single-color line chart for inline use beside a KPI. Stroke uses the
// secondary text token so it reads as a quiet supporting indicator, not a
// hero visualization. Y-axis is auto-scaled from the data; a flat (all-zero)
// series renders as a baseline.
export function Sparkline({
  data,
  width = 120,
  height = 32,
  showLastPoint = true,
  className,
}: SparklineProps) {
  const id = useId();

  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((value, i) => {
    const x = i * stepX;
    // Padded vertically so the line never touches the top/bottom edges.
    const padded = 2 + ((value - min) / range) * (height - 4);
    const y = height - padded;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  // Soft area fill under the line — flat fill in a neutral surface tone, no
  // gradient (brief forbids decorative gradients).
  const areaPath = `${linePath} L ${width.toFixed(1)} ${height} L 0 ${height} Z`;

  const last = points[points.length - 1];

  return (
    <svg
      role="img"
      aria-labelledby={`${id}-title`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
    >
      <title id={`${id}-title`}>{`7-day series, ${data.length} points`}</title>
      <path d={areaPath} fill="var(--ew-bg-secondary)" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--ew-text-secondary)"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showLastPoint && (
        <circle
          cx={last.x}
          cy={last.y}
          r={2}
          fill="var(--ew-text-primary)"
        />
      )}
    </svg>
  );
}
