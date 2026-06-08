import { FileText, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzerLabel, formatBytes, relativeTime, statusLabel } from "../labels";
import type { DocumentRecord, JobStatus } from "../types";

interface FileRowProps {
  doc: DocumentRecord;
  // If known, the status of the job this document was consumed by. Drives
  // the small status dot next to the JOB-id reference. Undefined for
  // documents not linked to any job.
  jobStatus?: JobStatus;
}

const STATUS_DOT_TONE: Record<JobStatus, string> = {
  completed: "bg-ew-success-text",
  in_progress: "bg-ew-info-text",
  pending: "bg-ew-warning-text",
  failed: "bg-ew-danger-text",
  cancelled: "bg-ew-neutral-text",
};

export function FileRow({ doc, jobStatus }: FileRowProps) {
  const isImage = doc.mime.startsWith("image/");
  const Icon = isImage ? ImageIcon : FileText;
  const unassigned = !doc.analyzer;
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-ew-bg-secondary text-ew-text-secondary">
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="truncate text-[14px] font-medium text-ew-text-primary">
              {doc.name}
            </span>
            <AnalyzerTag analyzer={doc.analyzer} />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-ew-text-tertiary">
            <span>{doc.mime}</span>
            <span aria-hidden>·</span>
            <span>{formatBytes(doc.sizeBytes)}</span>
            {doc.jobId && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1.5">
                  {jobStatus && (
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 rounded-full",
                        STATUS_DOT_TONE[jobStatus],
                        (jobStatus === "in_progress" || jobStatus === "pending") &&
                          "animate-pulse",
                      )}
                      title={statusLabel(jobStatus)}
                    />
                  )}
                  <span className="font-mono">{doc.jobId}</span>
                </span>
              </>
            )}
            {unassigned && (
              <>
                <span aria-hidden>·</span>
                <span>Not linked to a job</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-[12px] text-ew-text-tertiary">{relativeTime(doc.uploadedAt)}</div>
    </div>
  );
}

function AnalyzerTag({ analyzer }: { analyzer?: DocumentRecord["analyzer"] }) {
  const isUnassigned = !analyzer;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border-[0.5px] px-1.5 py-0.5 text-[11px] font-medium",
        isUnassigned
          ? "border-ew-border bg-ew-bg-secondary text-ew-text-tertiary"
          : "border-ew-border bg-ew-bg-secondary text-ew-text-secondary",
      )}
    >
      {isUnassigned ? "Unassigned" : analyzerLabel(analyzer)}
    </span>
  );
}
