import { Fragment, useMemo } from "react";
import { Link } from "react-router";
import { ArrowUpRight, FileText, IdCard, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/features/eligibility/components/AppHeader";
import { useAuthStore } from "@/stores/auth-store";
import { WorkspaceShell } from "./components/WorkspaceShell";
import { Skeleton } from "./components/Skeleton";
import { StatusDot } from "./components/StatusDot";
import { Sparkline } from "./components/Sparkline";
import { StackedBar } from "./components/StackedBar";
import { useJobQueueSummary } from "./hooks/useJobs";
import { analyzerLabel, dateBucket, relativeTime, statusLabel } from "./labels";
import type { AnalyzerType, JobStatus } from "./types";

const STATUS_KEYS: JobStatus[] = [
  "completed",
  "in_progress",
  "pending",
  "failed",
  "cancelled",
];

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

const ANALYZER_ICON: Record<AnalyzerType, typeof FileText> = {
  credit_report: ListChecks,
  bank_statement: FileText,
  id_validation: IdCard,
};

const HEALTH_LABEL: Record<"operational" | "active" | "degraded", string> = {
  operational: "Operational",
  active: "Active",
  degraded: "Degraded",
};

const HEALTH_DOT: Record<"operational" | "active" | "degraded", string> = {
  operational: "bg-ew-success-text",
  active: "bg-ew-info-text",
  degraded: "bg-ew-danger-text",
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const query = useJobQueueSummary();
  const firstName = user?.fullName?.split(" ")[0] ?? user?.email ?? "there";
  const data = query.data;

  return (
    <WorkspaceShell>
      <AppHeader
        crumbs={[
          { label: "Viewnear" },
          { label: "Analyzers · LendLogic", href: "/" },
          { label: "Overview" },
        ]}
      />

      <header className="mb-10 space-y-2">
        <p className="text-[14px] text-ew-text-secondary">Welcome back, {firstName}</p>
        <h1 className="text-[22px] font-medium tracking-tight text-ew-text-primary">Overview</h1>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-10">
          <HeroStat query={query} data={data} />
          <PipelineHealthCard data={data} loading={query.isLoading} />
          <DistributionCard data={data} loading={query.isLoading} />
          <AnalyzerBreakdownCard data={data} loading={query.isLoading} />
        </div>

        <RecentColumn data={data} loading={query.isLoading} />
      </div>
    </WorkspaceShell>
  );
}

function HeroStat({
  query,
  data,
}: {
  query: ReturnType<typeof useJobQueueSummary>;
  data: ReturnType<typeof useJobQueueSummary>["data"];
}) {
  // Compare last 3 days vs prior 3 to give the big number a qualitative
  // direction indicator. With 6 mock jobs the trend is noisy by design.
  const trend = useMemo(() => {
    if (!data) return null;
    const series = data.dailySeries.map((d) => d.count);
    const recent = series.slice(-3).reduce((a, b) => a + b, 0);
    const prior = series.slice(0, 3).reduce((a, b) => a + b, 0);
    const delta = recent - prior;
    if (delta === 0) return { sign: "flat" as const, value: 0 };
    return delta > 0
      ? { sign: "up" as const, value: delta }
      : { sign: "down" as const, value: Math.abs(delta) };
  }, [data]);

  return (
    <section className="space-y-3" aria-labelledby="total-heading">
      <h2 id="total-heading" className="sr-only">
        Total reports
      </h2>
      <div className="flex items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="text-[44px] font-medium leading-none tracking-tight tabular-nums text-ew-text-primary">
            {query.isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              data?.total.toLocaleString() ?? "—"
            )}
          </div>
          <p className="text-[14px] text-ew-text-secondary">reports analyzed</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {query.isLoading ? (
            <Skeleton className="h-8 w-[120px]" />
          ) : (
            <Sparkline data={data?.dailySeries.map((d) => d.count) ?? []} />
          )}
          <div className="flex items-center gap-1.5 text-[12px] text-ew-text-tertiary">
            {trend && trend.sign !== "flat" && (
              <span
                className={cn(
                  "tabular-nums font-medium",
                  trend.sign === "up" ? "text-ew-success-text" : "text-ew-text-secondary",
                )}
              >
                {trend.sign === "up" ? "+" : "−"}
                {trend.value}
              </span>
            )}
            <span>last 7 days</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PipelineHealthCard({
  data,
  loading,
}: {
  data: ReturnType<typeof useJobQueueSummary>["data"];
  loading: boolean;
}) {
  return (
    <section className="space-y-3" aria-labelledby="health-heading">
      <SectionLabel id="health-heading">Pipeline health</SectionLabel>
      <div className="grid gap-2 sm:grid-cols-3">
        {ANALYZER_KEYS.map((a) => {
          const Icon = ANALYZER_ICON[a];
          const health = data?.analyzerHealth[a] ?? "operational";
          return (
            <div
              key={a}
              className="flex items-center gap-3 rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-4"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-ew-bg-secondary text-ew-text-secondary">
                <Icon className="size-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="truncate text-[14px] font-medium text-ew-text-primary">
                  {analyzerLabel(a)}
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-ew-text-tertiary">
                  {loading ? (
                    <Skeleton className="h-3 w-16" />
                  ) : (
                    <>
                      <span aria-hidden className={cn("size-1.5 rounded-full", HEALTH_DOT[health])} />
                      <span>{HEALTH_LABEL[health]}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DistributionCard({
  data,
  loading,
}: {
  data: ReturnType<typeof useJobQueueSummary>["data"];
  loading: boolean;
}) {
  const segments = STATUS_KEYS.map((s) => ({
    key: s,
    value: data?.byStatus[s] ?? 0,
    className: STATUS_FILL[s],
    label: statusLabel(s),
  }));

  return (
    <section className="space-y-3" aria-labelledby="distribution-heading">
      <SectionLabel id="distribution-heading">Distribution</SectionLabel>
      {loading ? (
        <Skeleton className="h-2" />
      ) : (
        <StackedBar segments={segments} />
      )}
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px]">
        {STATUS_KEYS.map((s) => {
          const count = data?.byStatus[s] ?? 0;
          const muted = count === 0;
          return (
            <li
              key={s}
              className={cn("inline-flex items-center gap-1.5", muted && "opacity-50")}
            >
              <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_FILL[s])} />
              <span className="tabular-nums font-medium text-ew-text-primary">{count}</span>
              <span className="text-ew-text-secondary">{statusLabel(s)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AnalyzerBreakdownCard({
  data,
  loading,
}: {
  data: ReturnType<typeof useJobQueueSummary>["data"];
  loading: boolean;
}) {
  const max = data
    ? Math.max(1, ...ANALYZER_KEYS.map((a) => data.byAnalyzer[a]))
    : 1;
  return (
    <section className="space-y-3" aria-labelledby="analyzer-heading">
      <SectionLabel id="analyzer-heading">By analyzer</SectionLabel>
      <ul className="space-y-3">
        {ANALYZER_KEYS.map((a) => {
          const Icon = ANALYZER_ICON[a];
          const count = data?.byAnalyzer[a] ?? 0;
          const widthPct = data ? (count / max) * 100 : 0;
          return (
            <li key={a} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-[14px]">
                <span className="inline-flex items-center gap-2 text-ew-text-primary">
                  <Icon className="size-3.5 text-ew-text-tertiary" strokeWidth={1.75} />
                  {analyzerLabel(a)}
                </span>
                <span className="font-medium tabular-nums text-ew-text-primary">
                  {loading ? <Skeleton className="h-4 w-6" /> : count}
                </span>
              </div>
              {loading ? (
                <Skeleton className="h-1.5" />
              ) : (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ew-bg-secondary">
                  <div
                    className="h-full rounded-full bg-ew-text-primary/70 transition-[width]"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RecentColumn({
  data,
  loading,
}: {
  data: ReturnType<typeof useJobQueueSummary>["data"];
  loading: boolean;
}) {
  const grouped = useMemo(() => {
    if (!data) return [];
    const groups = new Map<string, typeof data.recent>();
    for (const job of data.recent) {
      const bucket = dateBucket(job.createdAt);
      const existing = groups.get(bucket) ?? [];
      existing.push(job);
      groups.set(bucket, existing);
    }
    return Array.from(groups.entries());
  }, [data]);

  return (
    <section className="space-y-4" aria-labelledby="recent-heading">
      <div className="flex items-end justify-between">
        <h2 id="recent-heading" className="text-[18px] font-medium tracking-tight text-ew-text-primary">
          Recent
        </h2>
        <Link
          to="/reports"
          className="text-[12px] text-ew-text-secondary transition-colors hover:text-ew-text-primary"
        >
          View all <ArrowUpRight className="ml-0.5 inline size-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 border-y-[0.5px] border-ew-border py-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : !data || data.recent.length === 0 ? (
        <p className="text-[14px] text-ew-text-tertiary">No reports yet.</p>
      ) : (
        <div className="border-y-[0.5px] border-ew-border">
          {grouped.map(([bucket, jobs]) => (
            <Fragment key={bucket}>
              <div className="pt-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
                {bucket}
              </div>
              <ul>
                {jobs.map((job, i) => {
                  const Icon = ANALYZER_ICON[job.analyzer];
                  return (
                    <li
                      key={job.id}
                      className={cn(i > 0 && "border-t-[0.5px] border-ew-border")}
                    >
                      <Link
                        to="/reports"
                        className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-ew-bg-secondary/40"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ew-bg-secondary text-ew-text-secondary">
                          <Icon className="size-3.5" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] text-ew-text-primary">
                            {analyzerLabel(job.analyzer)} analyzer
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-ew-text-tertiary">
                            <span className="font-mono">{job.id}</span>
                            <span aria-hidden>·</span>
                            <StatusDot status={job.status} />
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-[12px] text-ew-text-tertiary">
                          {relativeTime(job.createdAt)}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionLabel({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary"
    >
      {children}
    </h3>
  );
}
