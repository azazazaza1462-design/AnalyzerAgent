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
