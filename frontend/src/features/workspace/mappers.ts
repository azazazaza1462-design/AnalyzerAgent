// Maps the generated OpenAPI SDK shapes (Lendlogic.AnalyzersApi DTOs) to the
// frontend view types. The backend enums serialize as STRINGS at runtime
// ("IdValidation", "Pending") even though the generated types are numeric —
// Swashbuckle describes System.Text.Json string enums as integers. We map by
// the runtime string here, in one place, so the rest of the UI stays clean.
import type { JobDetail, JobSummary, FileSummary } from "@/services/generated/types.gen";
import type {
  AnalyzerJob,
  AnalyzerType,
  DocumentRecord,
  IdValidationResult,
  JobRun,
  JobStatus,
  StatusEvent,
} from "./types";

const TYPE_FROM_BACKEND: Record<string, AnalyzerType> = {
  IdValidation: "id_validation",
  CreditAnalysis: "credit_report",
  // No 1:1 frontend equivalent yet — cosmetic fallback for non-ID analyzers.
  RiskAssessment: "bank_statement",
  FraudDetection: "bank_statement",
};

const TYPE_TO_BACKEND: Record<AnalyzerType, string> = {
  id_validation: "IdValidation",
  credit_report: "CreditAnalysis",
  bank_statement: "FraudDetection",
};

const STATUS_FROM_BACKEND: Record<string, JobStatus> = {
  Pending: "pending",
  InProgress: "in_progress",
  Completed: "completed",
  Failed: "failed",
  Cancelled: "cancelled",
};

export function toAnalyzerType(raw: unknown): AnalyzerType {
  return TYPE_FROM_BACKEND[String(raw)] ?? "id_validation";
}

export function toJobStatus(raw: unknown): JobStatus {
  return STATUS_FROM_BACKEND[String(raw)] ?? "pending";
}

/** Frontend analyzer type -> backend JobType string (for createJob). */
export function toBackendJobType(analyzer: AnalyzerType): string {
  return TYPE_TO_BACKEND[analyzer];
}

interface ContentShape {
  applicationId?: string;
  attachments?: string[];
  documentType?: string;
  losData?: { fullName?: string; dateOfBirth?: string };
}

/** Lean list row (JobSummary has no content/attachments). */
export function summaryToJob(s: JobSummary): AnalyzerJob {
  return {
    id: s.id ?? "",
    analyzer: toAnalyzerType(s.jobType),
    status: toJobStatus(s.jobStatus),
    createdAt: s.createdAt ?? "",
    finishedAt: s.finishedAt ?? undefined,
    documentIds: [],
  };
}

/** Full run for the detail page: JobDetail + (optional) result_data + error. */
export function detailToRun(
  d: JobDetail,
  result?: IdValidationResult | null,
  error?: string | null,
): JobRun {
  const content = (d.content ?? {}) as ContentShape;
  const attachments = (d.attachments ?? []) as string[];
  const status = toJobStatus(d.jobStatus);
  const analyzer = toAnalyzerType(d.jobType);

  const statusHistory: StatusEvent[] = [];
  if (d.createdAt) statusHistory.push({ status: "pending", at: d.createdAt });
  if (d.startedAt) statusHistory.push({ status: "in_progress", at: d.startedAt });
  if (d.finishedAt) statusHistory.push({ status, at: d.finishedAt });

  return {
    id: d.id ?? "",
    analyzer,
    status,
    applicationId: content.applicationId,
    createdAt: d.createdAt ?? "",
    startedAt: d.startedAt ?? undefined,
    finishedAt: d.finishedAt ?? undefined,
    documentIds: attachments,
    errorLog: error ?? undefined,
    request: {
      documentType: analyzer,
      applicationId: content.applicationId,
      attachments,
      losData: content.losData,
    },
    calls: result?.calls ?? [],
    statusHistory,
    response: result ?? undefined,
    errors: error ? [error] : [],
  };
}

export function fileToDocument(f: FileSummary): DocumentRecord {
  return {
    id: f.id ?? "",
    name: f.fileName ?? "(unnamed)",
    mime: f.contentType ?? "application/octet-stream",
    sizeBytes: f.sizeBytes ?? 0,
    uploadedAt: f.createdAt ?? "",
  };
}
