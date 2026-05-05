import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { FilesListParams } from "@/lib/query-keys";
import { useFiles } from "./hooks/use-files";
import { FilesFilters } from "./components/FilesFilters";
import { FilesTable } from "./components/FilesTable";

const DEFAULT_PAGE_SIZE = 25;

export default function FilesPage() {
  const [params, setParams] = useState<FilesListParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const query = useFiles(params);

  const total = query.data?.total ?? 0;
  const items = query.data?.items ?? [];
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Files</h1>
          <p className="text-sm text-muted-foreground">
            {total > 0
              ? `${total} ${total === 1 ? "file" : "files"} matching your filter`
              : "Browse uploaded files"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Refresh
        </Button>
      </div>

      <FilesFilters value={params} onChange={setParams} />

      {query.isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {query.isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load files: {(query.error as Error).message}
        </div>
      )}

      {!query.isLoading && !query.isError && items.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No files found.
        </div>
      )}

      {!query.isLoading && !query.isError && items.length > 0 && (
        <>
          <FilesTable items={items} />
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
