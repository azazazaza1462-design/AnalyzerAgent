// Workspace types mirror the eventual Analyzer Jobs API. Treat shape changes
// here as a contract conversation with the backend (Service Bus message
// payload sits behind these names).

export type AnalyzerType = "credit_report" | "bank_statement" | "id_validation";

export type JobStatus =
  | "completed"
  | "in_progress"
  | "pending"
  | "failed"
  | "cancelled";

export interface AnalyzerJob {
  id: string;
  analyzer: AnalyzerType;
  status: JobStatus;
  applicationId?: string;
  createdAt: string;
  finishedAt?: string;
  documentIds: string[];
  errorLog?: string;
}

export interface DocumentRecord {
  id: string;
  name: string;
  mime: string;
  sizeBytes: number;
  uploadedAt: string;
  jobId?: string;
  analyzer?: AnalyzerType;
}

export interface JobQueueSummary {
  total: number;
  byStatus: Record<JobStatus, number>;
  byAnalyzer: Record<AnalyzerType, number>;
  // Last 7 calendar days of created-job counts, oldest first. The dashboard
  // sparkline reads this without re-aggregating per render.
  dailySeries: { date: string; count: number }[];
  // Per-analyzer health for the "pipeline health" card. Derived from the
  // job mix today (any in_progress = active, any failed today = degraded).
  analyzerHealth: Record<AnalyzerType, "operational" | "active" | "degraded">;
  recent: AnalyzerJob[];
}

// --- Canonical run hierarchy ----------------------------------------------
// Mirrors the backend contracts in Lendlogic.Agent.Core/Contracts. JSON is
// camelCase properties + snake_case enum values, so these unions line up with
// what the agent persists. AnalyzerJob (above) stays as the flat back-compat
// view; JobRun extends it with the request, per-step calls, status timeline,
// analyzer response, and errors.

export type IdVerdict = "verified" | "needs_review" | "rejected";

export type CheckStatus = "pass" | "borderline" | "fail" | "not_applicable";

// What the LOS/API sends when creating a job (shape of Job.Content).
export interface AnalyzerJobRequest {
  documentType: AnalyzerType;
  applicationId?: string;
  attachments: string[];
  losData?: {
    fullName?: string;
    dateOfBirth?: string; // ISO 8601 yyyy-MM-dd
  };
}

// One pipeline step the agent executed (a "call"), rendered in the run timeline.
export interface AnalyzerCall {
  step: string;
  label: string;
  model?: string; // undefined for deterministic (non-LLM) steps
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  error?: string;
}

export interface StatusEvent {
  status: JobStatus;
  at: string;
  note?: string;
}

// --- ID validation result (analyzer response) -----------------------------

export interface IdFields {
  fullName?: string;
  dateOfBirth?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  address?: string;
  country?: string;
  state?: string;
  documentKind?: string;
}

export interface IdCheck {
  name: string;
  status: CheckStatus;
  detail?: string;
}

export type EligibilityVerdict = "eligible" | "conditional" | "ineligible";

export interface FeatureContribution {
  feature: string;
  contribution: number;
}

// Output of the external eligibility model (stubbed) for the emitted features.
export interface EligibilityAssessment {
  score: number; // 0..1
  verdict: EligibilityVerdict;
  modelVersion: string;
  contributions: FeatureContribution[];
}

export interface IdValidationResult {
  fields: IdFields;
  checks: IdCheck[];
  verdict: IdVerdict;
  confidence: number; // 0..1
  eligibility?: EligibilityAssessment;
  calls: AnalyzerCall[];
}

// The rich, canonical view of a job. Extends the flat AnalyzerJob so existing
// consumers keep working while new screens read the run detail.
export interface JobRun extends AnalyzerJob {
  startedAt?: string;
  request: AnalyzerJobRequest;
  calls: AnalyzerCall[];
  statusHistory: StatusEvent[];
  response?: IdValidationResult; // present once the run completes
  errors: string[];
}
