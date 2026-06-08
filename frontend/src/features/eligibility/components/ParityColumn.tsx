import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { DimResult } from "../types";
import { DimResultPill } from "./StatusPill";

interface DimensionRow {
  name: string;
  result: DimResult;
  divergent?: boolean;
}

interface ParityColumnProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  dimensions: DimensionRow[];
  // Whether this column is the "active" model view. Doesn't change semantics,
  // only adds the 2px info border the brief mandates for the highlighted item.
  highlighted?: boolean;
  className?: string;
}

export function ParityColumn({
  title,
  subtitle,
  icon,
  dimensions,
  highlighted = false,
  className,
}: ParityColumnProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-ew-bg-primary p-5",
        highlighted ? "border-2 border-ew-info-text" : "border-[0.5px] border-ew-border",
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        {icon && <div className="text-ew-text-secondary">{icon}</div>}
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-[16px] font-medium text-ew-text-primary">{title}</h3>
          {subtitle && <p className="text-[12px] text-ew-text-tertiary">{subtitle}</p>}
        </div>
      </div>

      <ul className="space-y-0">
        {dimensions.map((d, i) => (
          <li
            key={d.name}
            className={cn(
              "flex items-center justify-between gap-3 py-2.5 text-[14px]",
              i > 0 && "border-t-[0.5px] border-ew-border",
            )}
          >
            <span
              className={cn(
                "min-w-0 truncate",
                d.divergent ? "font-medium text-ew-text-primary" : "text-ew-text-secondary",
              )}
            >
              {d.name}
            </span>
            <DimResultPill result={d.result} />
          </li>
        ))}
      </ul>
    </div>
  );
}
