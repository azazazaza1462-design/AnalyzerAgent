import { useMemo, useRef, useState } from "react";
import { ArrowRight, Calendar, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/features/eligibility/components/AppHeader";
import { WorkspaceShell } from "./components/WorkspaceShell";
import { JobRow } from "./components/JobRow";
import { RowSkeleton, Skeleton } from "./components/Skeleton";
import { EmptyState } from "./components/EmptyState";
import { FilterChip } from "./components/FilterChip";
import { StackedBar } from "./components/StackedBar";
import { Sparkline } from "./components/Sparkline";
import { useJobs } from "./hooks/useJobs";
import type { AnalyzerJob, AnalyzerType, JobStatus } from "./types";
import { analyzerLabel, dateBucket, statusLabel, type DateBucket } from "./labels";

interface Filters {
  status?: JobStatus;
  analyzer?: AnalyzerType;
  from?: string;
  to?: string;
}

const STATUS_KEYS: JobStatus[] = [
  "completed",
  "in_progress",
  "pending",
  "failed",
  "cancelled",
];

const STATUS_CHIP_TONE: Record<JobStatus, "neutral" | "danger"> = {
  completed: "neutral",
  in_progress: "neutral",
  pending: "neutral",
  failed: "danger",
  cancelled: "neutral",
};

const STATUS_FILL: Record<JobStatus, string> = {
  completed: "bg-ew-success-text",
  in_progress: "bg-ew-info-text",
  pending: "bg-ew-warning-text",
  failed: "bg-ew-danger-text",
  cancelled: "bg-ew-neutral-text",
};

const ANALYZER_KEYS: AnalyzerType[] = [
  "credit_report",
  "bank_statement",
  "id_validation",
];

export default function ReportsPage() {
  const [filters, setFilters] = useState<Filters>({});

  // Status + analyzer filters are applied client-side so chip counts stay
  // honest. Date filters go to the API since they bound the population we
  // even consider.
  const query = useJobs({ from: filters.from, to: filters.to });
  const all = query.data ?? [];

  // Counts ignore the status/analyzer filters so each chip can show its own
  // population. Date range still applies — date is the outer filter.
  const counts = useMemo(() => {
    const byStatus: Record<JobStatus, number> = {
      completed: 0,
      in_progress: 0,
      pending: 0,
      failed: 0,
      cancelled: 0,
    };
    const byAnalyzer: Record<AnalyzerType, number> = {
      credit_report: 0,
      bank_statement: 0,
      id_validation: 0,
    };
    for (const j of all) {
      byStatus[j.status]++;
      byAnalyzer[j.analyzer]++;
    }
    return { all: all.length, byStatus, byAnalyzer };
  }, [all]);

  const jobs = useMemo(
    () =>
      all.filter((j) => {
        if (filters.status && j.status !== filters.status) return false;
        if (filters.analyzer && j.analyzer !== filters.analyzer) return false;
        return true;
      }),
    [all, filters.status, filters.analyzer],
  );

  // Distribution shown in the summary strip = jobs matching the current
  // filters. So the user sees the shape of what's actually in front of them,
  // not a stale all-status mix.
  const visibleByStatus = useMemo(() => {
    const map: Record<JobStatus, number> = {
      completed: 0,
      in_progress: 0,
      pending: 0,
      failed: 0,
      cancelled: 0,
    };
    for (const j of jobs) map[j.status]++;
    return map;
  }, [jobs]);

  // 7-day activity bucketed by calendar day. Reuses the date-range population
  // so the sparkline corresponds to what's in the table.
  const dailySeries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const series: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = today.getTime() - i * 86_400_000;
      const dayEnd = dayStart + 86_400_000;
      series.push(
        jobs.filter((j) => {
          const t = Date.parse(j.createdAt);
          return t >= dayStart && t < dayEnd;
        }).length,
      );
    }
    return series;
  }, [jobs]);

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const hasFilter = Boolean(
    filters.status || filters.analyzer || filters.from || filters.to,
  );
  const resetAll = () => setFilters({});

  return (
    <WorkspaceShell>
      <AppHeader
        crumbs={[
          { label: "Viewnear" },
          { label: "Analyzers · LendLogic", href: "/" },
          { label: "Reports" },
        ]}
      />

      <header className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-[22px] font-medium tracking-tight text-ew-text-primary">
            Reports
          </h1>
          <p className="text-[14px] text-ew-text-secondary">
            {jobs.length}{" "}
            {jobs.length === 1 ? "report matching" : "reports matching"} your filters
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

      <SummaryStrip
        total={jobs.length}
        byStatus={visibleByStatus}
        dailySeries={dailySeries}
        loading={query.isLoading}
      />

      <div className="mt-8 mb-8 space-y-4 border-b-[0.5px] border-ew-border pb-6">
        <div className="space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
            Status
          </span>
          <div
            role="tablist"
            aria-label="Filter by status"
            className="flex flex-wrap items-center gap-2"
          >
            <FilterChip
              label="All"
              count={counts.all}
              active={!filters.status}
              onClick={() => update({ status: undefined })}
            />
            {STATUS_KEYS.map((s) => (
              <FilterChip
                key={s}
                label={statusLabel(s)}
                count={counts.byStatus[s]}
                active={filters.status === s}
                onClick={() => update({ status: s })}
                tone={STATUS_CHIP_TONE[s]}
              />
            ))}
          </div>
        </div>

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
              active={!filters.analyzer}
              onClick={() => update({ analyzer: undefined })}
            />
            {ANALYZER_KEYS.map((a) => (
              <FilterChip
                key={a}
                label={analyzerLabel(a)}
                count={counts.byAnalyzer[a]}
                active={filters.analyzer === a}
                onClick={() => update({ analyzer: a })}
              />
            ))}
          </div>
        </div>

        <DateRangeField
          from={filters.from?.slice(0, 10) ?? ""}
          to={filters.to?.slice(0, 10) ?? ""}
          onChange={(next) =>
            setFilters((f) => ({
              ...f,
              from: next.from || undefined,
              to: next.to || undefined,
            }))
          }
          onClearAll={hasFilter ? resetAll : undefined}
        />
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No results matching your filters"
          description={
            hasFilter
              ? "Adjust the filters above to see more reports."
              : "There are no analyzer reports yet."
          }
        />
      ) : (
        <GroupedJobs jobs={jobs} />
      )}
    </WorkspaceShell>
  );
}

function SummaryStrip({
  total,
  byStatus,
  dailySeries,
  loading,
}: {
  total: number;
  byStatus: Record<JobStatus, number>;
  dailySeries: number[];
  loading: boolean;
}) {
  const segments = STATUS_KEYS.map((s) => ({
    key: s,
    value: byStatus[s],
    className: STATUS_FILL[s],
    label: statusLabel(s),
  }));

  return (
    <div className="grid gap-6 rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="space-y-0.5">
        <div className="text-[28px] font-medium leading-none tabular-nums text-ew-text-primary">
          {loading ? <Skeleton className="h-7 w-12" /> : total.toLocaleString()}
        </div>
        <p className="text-[12px] text-ew-text-tertiary">jobs in range</p>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
          Distribution
        </div>
        {loading ? (
          <Skeleton className="h-2" />
        ) : (
          <StackedBar segments={segments} />
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        {loading ? (
          <Skeleton className="h-8 w-[120px]" />
        ) : (
          <Sparkline data={dailySeries} />
        )}
        <span className="text-[11px] uppercase tracking-wider text-ew-text-tertiary">
          7-day activity
        </span>
      </div>
    </div>
  );
}

const BUCKETS: DateBucket[] = ["Today", "Yesterday", "Earlier this week", "Earlier"];

function GroupedJobs({ jobs }: { jobs: AnalyzerJob[] }) {
  const byBucket = useMemo(() => {
    const map = new Map<DateBucket, AnalyzerJob[]>();
    for (const j of jobs) {
      const bucket = dateBucket(j.createdAt);
      const existing = map.get(bucket) ?? [];
      existing.push(j);
      map.set(bucket, existing);
    }
    return map;
  }, [jobs]);

  return (
    <div className="space-y-8">
      {BUCKETS.map((bucket) => {
        const group = byBucket.get(bucket);
        if (!group || group.length === 0) return null;
        return (
          <div key={bucket} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
                {bucket}
              </span>
              <span className="h-px flex-1 bg-ew-border" aria-hidden />
              <span className="text-[12px] tabular-nums text-ew-text-tertiary">
                {group.length}
              </span>
            </div>
            <ul className="space-y-2">
              {group.map((job) => (
                <li key={job.id}>
                  <JobRow job={job} href="/reports" />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// === Date range field ==================================================
// Single pill containing both ends of the range, with quick-select presets
// above. Matches the Linear/Stripe pattern: the dates feel like one unit, not
// two independent inputs. Native date inputs sit inside the pill with
// transparent backgrounds, their indicators hidden — clicking anywhere on a
// date opens the picker via the native indicator stretched to full size.

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface DateRange {
  from: string;
  to: string;
}

function lastNDays(n: number): DateRange {
  const to = new Date();
  const from = new Date(Date.now() - n * 86_400_000);
  return { from: isoDay(from), to: isoDay(to) };
}

function todayRange(): DateRange {
  const t = isoDay(new Date());
  return { from: t, to: t };
}

function thisMonthRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: isoDay(start), to: isoDay(now) };
}

interface PresetSpec {
  label: string;
  range: () => DateRange;
}

const PRESETS: PresetSpec[] = [
  { label: "Today", range: todayRange },
  { label: "7 days", range: () => lastNDays(7) },
  { label: "30 days", range: () => lastNDays(30) },
  { label: "This month", range: thisMonthRange },
];

function DateRangeField({
  from,
  to,
  onChange,
  onClearAll,
}: {
  from: string;
  to: string;
  onChange: (next: DateRange) => void;
  // When non-null, surfaces the broader "Clear filters" affordance on the
  // right-hand side of the row — the parent owns whether other filters
  // (status, analyzer) are also active.
  onClearAll?: () => void;
}) {
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const hasRange = from !== "" || to !== "";

  const isPresetActive = (preset: PresetSpec): boolean => {
    const r = preset.range();
    return r.from === from && r.to === to;
  };

  // Clicking the shared leading calendar icon opens the FROM picker when no
  // range is set yet, or the TO picker when FROM already has a value — the
  // most likely next action in each case.
  const openLeadingPicker = () => {
    const target = from === "" ? fromRef.current : toRef.current;
    openPicker(target);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
          Date range
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => {
            const active = isPresetActive(p);
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange(p.range())}
                className={cn(
                  "rounded-md border-[0.5px] px-2 py-0.5 text-[11px] font-medium transition-colors",
                  active
                    ? "border-ew-text-primary bg-ew-text-primary text-ew-bg-primary"
                    : "border-ew-border bg-ew-bg-secondary text-ew-text-secondary hover:border-ew-border-strong hover:text-ew-text-primary",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-9 items-center gap-2 rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary pl-2 pr-1 transition-colors focus-within:border-ew-border-strong">
          <button
            type="button"
            onClick={openLeadingPicker}
            aria-label="Open date picker"
            className="rounded p-0.5 text-ew-text-tertiary transition-colors hover:bg-ew-bg-primary hover:text-ew-text-primary"
          >
            <Calendar className="size-3.5" />
          </button>
          <DateInput
            ref={fromRef}
            value={from}
            onChange={(v) => onChange({ from: v, to })}
            label="From date"
            max={to || undefined}
          />
          <ArrowRight className="size-3 shrink-0 text-ew-text-tertiary" aria-hidden />
          <DateInput
            ref={toRef}
            value={to}
            onChange={(v) => onChange({ from, to: v })}
            label="To date"
            min={from || undefined}
          />
          {hasRange && (
            <button
              type="button"
              onClick={() => onChange({ from: "", to: "" })}
              aria-label="Clear date range"
              className="ml-1 rounded p-1 text-ew-text-tertiary transition-colors hover:bg-ew-bg-primary hover:text-ew-text-primary"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ew-text-secondary transition-colors hover:text-ew-text-primary"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

// `showPicker()` is the modern way to programmatically open the native date
// popover (Chrome 99+, Firefox 101+, Safari 16+). It throws if not invoked
// from a user gesture or if unsupported — we fall back to focus() so the
// input is at least selectable.
function openPicker(el: HTMLInputElement | null): void {
  if (!el) return;
  try {
    if (typeof el.showPicker === "function") {
      el.showPicker();
      return;
    }
  } catch {
    /* fall through to focus */
  }
  el.focus();
}

// Borderless inner input. The visual container (pill) carries the border,
// focus ring, and hover state. We hide the native indicator with opacity-0
// (NOT stretched absolute — that was overlapping the sibling input and the
// clear button) and explicitly call showPicker() on click so clicking the
// date text opens the popover.
const DateInput = ({
  ref,
  value,
  onChange,
  label,
  min,
  max,
}: {
  ref: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  label: string;
  min?: string;
  max?: string;
}) => {
  return (
    <input
      ref={ref}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={() => openPicker(ref.current)}
      min={min}
      max={max}
      aria-label={label}
      className="w-[120px] cursor-pointer bg-transparent text-[14px] text-ew-text-primary outline-none [color-scheme:light_dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&:not(:focus):invalid]:text-ew-danger-text"
    />
  );
};
