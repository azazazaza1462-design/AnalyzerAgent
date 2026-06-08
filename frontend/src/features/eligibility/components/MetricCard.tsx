import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  href?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  className?: string;
}

const TONE_ACCENT: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  neutral: "text-ew-text-primary",
  success: "text-ew-success-text",
  warning: "text-ew-warning-text",
  danger: "text-ew-danger-text",
};

// Compact, neutral card that fronts a deeper screen when href is supplied.
// Used both on the detail page (3 cards → governance) and on governance itself.
export function MetricCard({
  label,
  value,
  meta,
  icon,
  href,
  tone = "neutral",
  className,
}: MetricCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] text-ew-text-tertiary">
          {icon && <span className="text-ew-text-secondary">{icon}</span>}
          <span>{label}</span>
        </div>
        {href && <ChevronRight className="size-3.5 text-ew-text-tertiary" />}
      </div>
      <div className={cn("mt-3 text-[18px] font-medium tabular-nums", TONE_ACCENT[tone])}>
        {value}
      </div>
      {meta && <div className="mt-1 text-[12px] text-ew-text-secondary">{meta}</div>}
    </>
  );

  const baseClasses = cn(
    "block rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-4 transition-colors",
    href && "hover:border-ew-border-strong",
    className,
  );

  return href ? (
    <Link to={href} className={baseClasses}>
      {body}
    </Link>
  ) : (
    <div className={baseClasses}>{body}</div>
  );
}
