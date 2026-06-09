import { Link } from "react-router";
import { AlertCircle, ArrowUpRight, FileText, IdCard, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzerLabel, formatDuration, relativeTime, statusLabel } from "../labels";
import type { AnalyzerJob, AnalyzerType } from "../types";
import { StatusDot } from "./StatusDot";

interface JobRowProps {
  job: AnalyzerJob;
  href?: string;
}

const ANALYZER_ICON: Record<AnalyzerType, typeof FileText> = {
  credit_report: ListChecks,
  bank_statement: FileText,
  id_validation: IdCard,
};

// Single row in the Reports list. Failed jobs accent the border in danger and
// surface an inline excerpt of the error log — the failure has to be readable
// from the list level, not buried in a detail view.
export function JobRow({ job, href }: JobRowProps) {
  const Icon = ANALYZER_ICON[job.analyzer];
  const isFailed = job.status === "failed";
  const stamp = job.finishedAt
    ? `finished ${relativeTime(job.finishedAt)}`
    : relativeTime(job.createdAt);
  const docCount = job.documentIds.length;

  // Duration label varies by lifecycle. Pending/cancelled-no-finish jobs show
  // nothing — there's no meaningful elapsed window to surface.
  const durationLabel = (() => {
    if (job.finishedAt) return `ran ${formatDuration(job.createdAt, job.finishedAt)}`;
    if (job.status === "in_progress") return `running ${formatDuration(job.createdAt)}`;
    return null;
  })();

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md",
              isFailed
                ? "bg-ew-danger-bg text-ew-danger-text"
                : "bg-ew-bg-secondary text-ew-text-secondary",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2.5">
              <span className="truncate text-[14px] font-medium text-ew-text-primary">
                {analyzerLabel(job.analyzer)} analyzer
              </span>
              <StatusDot status={job.status} />
            </div>
            <div className="flex items-center gap-2 font-mono text-[12px] text-ew-text-tertiary">
              <span>{job.id}</span>
              {job.applicationId && (
                <>
                  <span aria-hidden>·</span>
                  <span>{job.applicationId}</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span>
                {docCount} {docCount === 1 ? "doc" : "docs"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-[12px] text-ew-text-tertiary">
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap">{stamp}</span>
            {href && (
              <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ew-text-primary" />
            )}
          </div>
          {durationLabel && (
            <span className="whitespace-nowrap text-ew-text-tertiary/80">{durationLabel}</span>
          )}
        </div>
      </div>

      {isFailed && job.errorLog && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-ew-danger-bg/40 px-3 py-2 text-[12px] text-ew-danger-text">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span className="line-clamp-2">{job.errorLog}</span>
        </div>
      )}

      <span className="sr-only">Status: {statusLabel(job.status)}</span>
    </>
  );

  const rowClasses = cn(
    "group block rounded-xl bg-ew-bg-primary p-4 transition-colors",
    isFailed
      ? "border-[0.5px] border-ew-danger-text/30"
      : "border-[0.5px] border-ew-border",
    href && "hover:border-ew-border-strong",
  );

  return href ? (
    <Link to={href} className={rowClasses}>
      {content}
    </Link>
  ) : (
    <div className={rowClasses}>{content}</div>
  );
}
