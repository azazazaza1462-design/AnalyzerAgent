import { Badge } from "@/components/ui/badge";
import type { JobStatusName } from "@/lib/query-keys";

const variantByStatus: Record<
  JobStatusName,
  "info" | "warning" | "success" | "destructive" | "outline"
> = {
  Pending: "info",
  InProgress: "warning",
  Completed: "success",
  Failed: "destructive",
  Cancelled: "outline",
};

interface StatusBadgeProps {
  status?: JobStatusName | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <Badge variant="outline">—</Badge>;
  const variant = variantByStatus[status as JobStatusName] ?? "outline";
  return <Badge variant={variant}>{status}</Badge>;
}
