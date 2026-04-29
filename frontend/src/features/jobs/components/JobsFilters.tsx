import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { JobStatusName, JobsListParams } from "@/lib/query-keys";

const STATUS_OPTIONS: JobStatusName[] = ["Pending", "InProgress", "Completed", "Failed"];

interface JobsFiltersProps {
  value: JobsListParams;
  onChange: (next: JobsListParams) => void;
}

export function JobsFilters({ value, onChange }: JobsFiltersProps) {
  const reset = () => onChange({ page: 1, pageSize: value.pageSize ?? 25 });

  const update = (patch: Partial<JobsListParams>) => {
    onChange({ ...value, ...patch, page: 1 });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <select
          value={value.status ?? ""}
          onChange={(e) => update({ status: (e.target.value || undefined) as JobStatusName })}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">All</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">From</label>
        <Input
          type="date"
          value={value.from?.slice(0, 10) ?? ""}
          onChange={(e) => update({ from: e.target.value || undefined })}
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">To</label>
        <Input
          type="date"
          value={value.to?.slice(0, 10) ?? ""}
          onChange={(e) => update({ to: e.target.value || undefined })}
          className="w-40"
        />
      </div>

      <Button variant="outline" size="sm" onClick={reset} className="ml-auto">
        Clear
      </Button>
    </div>
  );
}
