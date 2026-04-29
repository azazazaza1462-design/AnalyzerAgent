import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { JobsListParams } from "@/lib/query-keys";
import { useJobs } from "./hooks/use-jobs";
import { JobsFilters } from "./components/JobsFilters";
import { JobsTable } from "./components/JobsTable";

const DEFAULT_PAGE_SIZE = 25;

export default function JobsPage() {
  const [params, setParams] = useState<JobsListParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const query = useJobs(params);

  const total = query.data?.total ?? 0;
  const items = query.data?.items ?? [];
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {total > 0
              ? `${total} ${total === 1 ? "job" : "jobs"} matching your filters`
              : "Browse and inspect analyzer jobs"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Refresh
        </Button>
      </div>

      <JobsFilters value={params} onChange={setParams} />

      {query.isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {query.isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load jobs: {(query.error as Error).message}
        </div>
      )}

      {!query.isLoading && !query.isError && items.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No jobs found.
        </div>
      )}

      {!query.isLoading && !query.isError && items.length > 0 && (
        <>
          <JobsTable items={items} />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setParams((p) => ({ ...p, page: Math.max(1, (p.page ?? 1) - 1) }))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setParams((p) => ({ ...p, page: Math.min(totalPages, (p.page ?? 1) + 1) }))
                }
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
