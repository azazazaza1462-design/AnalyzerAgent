import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-ew-bg-secondary", className)} />;
}

export function RowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Skeleton className="size-9" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}
