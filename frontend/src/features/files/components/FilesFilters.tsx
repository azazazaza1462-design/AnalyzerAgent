import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FilesListParams } from "@/lib/query-keys";

interface FilesFiltersProps {
  value: FilesListParams;
  onChange: (next: FilesListParams) => void;
}

export function FilesFilters({ value, onChange }: FilesFiltersProps) {
  const reset = () => onChange({ page: 1, pageSize: value.pageSize ?? 25 });

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Search filename</label>
        <Input
          type="search"
          value={value.search ?? ""}
          onChange={(e) =>
            onChange({ ...value, search: e.target.value || undefined, page: 1 })
          }
          placeholder="report.pdf"
          className="w-64"
        />
      </div>

      <Button variant="outline" size="sm" onClick={reset} className="ml-auto">
        Clear
      </Button>
    </div>
  );
}
