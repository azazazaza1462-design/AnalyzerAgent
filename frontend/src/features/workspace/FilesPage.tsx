import { useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/features/eligibility/components/AppHeader";
import { WorkspaceShell } from "./components/WorkspaceShell";
import { FileRow } from "./components/FileRow";
import { RowSkeleton, Skeleton } from "./components/Skeleton";
import { EmptyState } from "./components/EmptyState";
import { FilterChip } from "./components/FilterChip";
import { StackedBar } from "./components/StackedBar";
import { useDocuments, useJobs } from "./hooks/useJobs";
import { analyzerLabel, formatBytes } from "./labels";
import type { AnalyzerType, DocumentRecord, JobStatus } from "./types";

type AnalyzerBucket = AnalyzerType | "unassigned";
type ActiveBucket = AnalyzerBucket | "all";

const BUCKET_KEYS: AnalyzerBucket[] = [
  "credit_report",
  "bank_statement",
  "id_validation",
  "unassigned",
];

// Bar colors per analyzer in the storage strip. Chosen so the three
// analyzers read as distinct categorical hues (info / warning / success);
// "unassigned" maps to neutral so it doesn't compete for attention.
const ANALYZER_FILL: Record<AnalyzerBucket, string> = {
  credit_report: "bg-ew-info-text",
  bank_statement: "bg-ew-warning-text",
  id_validation: "bg-ew-success-text",
  unassigned: "bg-ew-neutral-text",
};

function bucketOf(doc: DocumentRecord): AnalyzerBucket {
  return doc.analyzer ?? "unassigned";
}

function bucketLabel(bucket: AnalyzerBucket): string {
  return bucket === "unassigned" ? "Unassigned" : analyzerLabel(bucket);
}

const PAGE_SIZE = 25;

export default function FilesPage() {
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState<ActiveBucket>("all");
  const [page, setPage] = useState(1);

  // Pull the search-matched superset so chips and the storage strip have
  // accurate aggregates. The bucket filter and pagination apply locally.
  const query = useDocuments({ search, page: 1, pageSize: 100 });
  const allItems = query.data?.items ?? [];

  // Sibling query for job statuses, so the file row can show a small dot
  // beside the JOB-id reference. React Query dedups this when the page
  // loads and other consumers want the same data.
  const jobsQuery = useJobs({});
  const jobStatusById = useMemo(() => {
    const map = new Map<string, JobStatus>();
    for (const j of jobsQuery.data ?? []) map.set(j.id, j.status);
    return map;
  }, [jobsQuery.data]);

  const counts = useMemo(() => {
    const byBucket: Record<AnalyzerBucket, number> = {
      credit_report: 0,
      bank_statement: 0,
      id_validation: 0,
      unassigned: 0,
    };
    const bytesByBucket: Record<AnalyzerBucket, number> = {
      credit_report: 0,
      bank_statement: 0,
      id_validation: 0,
      unassigned: 0,
    };
    let totalBytes = 0;
    for (const d of allItems) {
      const b = bucketOf(d);
      byBucket[b]++;
      bytesByBucket[b] += d.sizeBytes;
      totalBytes += d.sizeBytes;
    }
    return {
      all: allItems.length,
      totalBytes,
      byBucket,
      bytesByBucket,
    };
  }, [allItems]);

  const filtered =
    bucket === "all" ? allItems : allItems.filter((d) => bucketOf(d) === bucket);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const hasFilter = search.length > 0 || bucket !== "all";

  const reset = () => {
    setSearch("");
    setBucket("all");
    setPage(1);
  };

  return (
    <WorkspaceShell>
      <AppHeader
        crumbs={[
          { label: "Viewnear" },
          { label: "Analyzers · LendLogic", href: "/" },
          { label: "Files" },
        ]}
      />

      <header className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-[22px] font-medium tracking-tight text-ew-text-primary">Files</h1>
          <p className="text-[14px] text-ew-text-secondary">
            {total} {total === 1 ? "file matching" : "files matching"} your filter
          </p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="inline-flex items-center gap-1.5 rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary px-3 py-1.5 text-[12px] font-medium text-ew-text-primary transition-colors hover:border-ew-border-strong disabled:opacity-60"
        >
          <RefreshCw className={cn("size-3.5", query.isFetching && "animate-spin")} />
          Refresh
        </button>
      </header>

      <StorageStrip
        total={counts.all}
        totalBytes={counts.totalBytes}
        bytesByBucket={counts.bytesByBucket}
        countByBucket={counts.byBucket}
        loading={query.isLoading}
      />

      <div className="mt-8 mb-8 space-y-4 border-b-[0.5px] border-ew-border pb-6">
        <div className="space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
            Analyzer
          </span>
          <div
            role="tablist"
            aria-label="Filter by analyzer"
            className="flex flex-wrap items-center gap-2"
          >
            <FilterChip
              label="All"
              count={counts.all}
              active={bucket === "all"}
              onClick={() => {
                setBucket("all");
                setPage(1);
              }}
            />
            {BUCKET_KEYS.map((b) => (
              <FilterChip
                key={b}
                label={bucketLabel(b)}
                count={counts.byBucket[b]}
                active={bucket === b}
                onClick={() => {
                  setBucket(b);
                  setPage(1);
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium uppercase tracking-wide text-ew-text-tertiary">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ew-text-tertiary" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="filename"
                className="h-9 w-64 rounded-md border-[0.5px] border-ew-border bg-ew-bg-primary pl-8 pr-3 text-[14px] text-ew-text-primary placeholder:text-ew-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ew-info-text/40"
              />
            </div>
          </div>
          {hasFilter && (
            <button
              type="button"
              onClick={reset}
              className="ml-auto rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ew-text-secondary transition-colors hover:text-ew-text-primary"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="No results matching your filters"
          description={
            hasFilter
              ? "Try a different filename or analyzer."
              : "No documents have been ingested yet."
          }
        />
      ) : bucket === "all" ? (
        // No chip filter active → group by analyzer to give the list shape.
        <GroupedDocs docs={visible} jobStatusById={jobStatusById} />
      ) : (
        <ul className="space-y-2">
          {visible.map((doc) => (
            <li key={doc.id}>
              <FileRow
                doc={doc}
                jobStatus={doc.jobId ? jobStatusById.get(doc.jobId) : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      {!query.isLoading && visible.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-[12px] text-ew-text-tertiary">
          <span>
            Page {safePage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <PageButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              Previous
            </PageButton>
            <PageButton
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Next
            </PageButton>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}

function StorageStrip({
  total,
  totalBytes,
  bytesByBucket,
  countByBucket,
  loading,
}: {
  total: number;
  totalBytes: number;
  bytesByBucket: Record<AnalyzerBucket, number>;
  countByBucket: Record<AnalyzerBucket, number>;
  loading: boolean;
}) {
  const segments = BUCKET_KEYS.map((b) => ({
    key: b,
    value: bytesByBucket[b],
    className: ANALYZER_FILL[b],
    label: bucketLabel(b),
  }));

  return (
    <div className="grid gap-6 rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-5 sm:grid-cols-[auto_auto_1fr] sm:items-center">
      <div className="space-y-0.5">
        <div className="text-[28px] font-medium leading-none tabular-nums text-ew-text-primary">
          {loading ? <Skeleton className="h-7 w-12" /> : total.toLocaleString()}
        </div>
        <p className="text-[12px] text-ew-text-tertiary">documents</p>
      </div>

      <div className="space-y-0.5">
        <div className="text-[28px] font-medium leading-none tabular-nums text-ew-text-primary">
          {loading ? <Skeleton className="h-7 w-20" /> : formatBytes(totalBytes)}
        </div>
        <p className="text-[12px] text-ew-text-tertiary">total size</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
            Storage by analyzer
          </span>
        </div>
        {loading ? (
          <Skeleton className="h-2" />
        ) : (
          <StackedBar segments={segments} />
        )}
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px]">
          {BUCKET_KEYS.map((b) => {
            const count = countByBucket[b];
            const bytes = bytesByBucket[b];
            const muted = count === 0;
            return (
              <li
                key={b}
                className={cn("inline-flex items-center gap-1.5", muted && "opacity-50")}
              >
                <span aria-hidden className={cn("size-1.5 rounded-full", ANALYZER_FILL[b])} />
                <span className="text-ew-text-secondary">{bucketLabel(b)}</span>
                <span className="tabular-nums text-ew-text-tertiary">{formatBytes(bytes)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function GroupedDocs({
  docs,
  jobStatusById,
}: {
  docs: DocumentRecord[];
  jobStatusById: Map<string, JobStatus>;
}) {
  const byBucket = useMemo(() => {
    const map = new Map<AnalyzerBucket, DocumentRecord[]>();
    for (const d of docs) {
      const b = bucketOf(d);
      const existing = map.get(b) ?? [];
      existing.push(d);
      map.set(b, existing);
    }
    return map;
  }, [docs]);

  return (
    <div className="space-y-8">
      {BUCKET_KEYS.map((b) => {
        const group = byBucket.get(b);
        if (!group || group.length === 0) return null;
        return (
          <div key={b} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
                {bucketLabel(b)}
              </span>
              <span className="h-px flex-1 bg-ew-border" aria-hidden />
              <span className="text-[12px] tabular-nums text-ew-text-tertiary">
                {group.length}
              </span>
            </div>
            <ul className="space-y-2">
              {group.map((doc) => (
                <li key={doc.id}>
                  <FileRow
                    doc={doc}
                    jobStatus={doc.jobId ? jobStatusById.get(doc.jobId) : undefined}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary px-3 py-1.5 text-[12px] font-medium text-ew-text-primary transition-colors enabled:hover:border-ew-border-strong disabled:opacity-50"
    >
      {children}
    </button>
  );
}
