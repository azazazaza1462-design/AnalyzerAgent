import { useState } from "react";
import { Link } from "react-router";
import { AlertCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/features/eligibility/components/AppHeader";
import { WorkspaceShell } from "./components/WorkspaceShell";
import { EmptyState } from "./components/EmptyState";
import { useJobRun, useJobs } from "./hooks/useJobs";
import { analyzerLabel, relativeTime } from "./labels";
import type { AnalyzerJob, AnalyzerType } from "./types";

type Filter = AnalyzerType | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "id_validation", label: "ID validation" },
  { value: "credit_report", label: "Credit report" },
  { value: "bank_statement", label: "Bank statement" },
];

export default function ErrorLogPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data: jobs = [], isLoading } = useJobs({ status: "failed" });

  const rows = filter === "all" ? jobs : jobs.filter((j) => j.analyzer === filter);

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-3xl">
        <AppHeader
          crumbs={[
            { label: "Viewnear" },
            { label: "Analyzers · LendLogic", href: "/" },
            { label: "Error log" },
          ]}
        />

        <header className="mb-6 space-y-2">
          <h1 className="text-[22px] font-medium tracking-tight text-ew-text-primary">Error log</h1>
          <p className="text-[14px] text-ew-text-secondary">
            Runs that failed during analysis. Open one to see the full timeline and steps.
          </p>
        </header>

        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-md border-[0.5px] px-2.5 py-1 text-[12px] font-medium transition-colors",
                filter === f.value
                  ? "border-ew-text-primary text-ew-text-primary"
                  : "border-ew-border text-ew-text-secondary hover:border-ew-border-strong",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-[14px] text-ew-text-tertiary">Loading…</p>}

        {!isLoading && rows.length === 0 ? (
          <EmptyState title="No failed runs" description="Failed analyses will appear here." />
        ) : (
          <ul className="space-y-2">
            {rows.map((job) => (
              <li key={job.id}>
                <ErrorRow job={job} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </WorkspaceShell>
  );
}

function ErrorRow({ job }: { job: AnalyzerJob }) {
  // Failed jobs are terminal, so this is a single fetch (no polling) for the
  // error message, which the lean list endpoint doesn't carry.
  const { data: run } = useJobRun(job.id);
  const message = run?.errors[0];
  const stamp = job.finishedAt ? relativeTime(job.finishedAt) : relativeTime(job.createdAt);

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group block rounded-xl border-[0.5px] border-ew-danger-text/30 bg-ew-bg-primary p-4 transition-colors hover:border-ew-danger-text/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-ew-danger-bg text-ew-danger-text">
            <AlertCircle className="size-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-1">
            <span className="block text-[14px] font-medium text-ew-text-primary">
              {analyzerLabel(job.analyzer)} analyzer
            </span>
            <span className="block font-mono text-[12px] text-ew-text-tertiary">{job.id}</span>
            {message && <p className="line-clamp-2 text-[12px] text-ew-danger-text">{message}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap text-[12px] text-ew-text-tertiary">
          {stamp}
          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ew-text-primary" />
        </div>
      </div>
    </Link>
  );
}
