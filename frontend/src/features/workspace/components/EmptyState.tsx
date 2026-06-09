import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

// Restrained empty state: dashed border, single line of helper text. Used by
// Reports and Files for "no results matching your filters".
export function EmptyState({ title, description, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-[0.5px] border-dashed border-ew-border bg-ew-bg-primary px-6 py-12 text-center",
        className,
      )}
    >
      {icon && <div className="text-ew-text-tertiary">{icon}</div>}
      <div className="text-[14px] font-medium text-ew-text-primary">{title}</div>
      {description && (
        <div className="max-w-sm text-[12px] text-ew-text-secondary">{description}</div>
      )}
    </div>
  );
}
