import type {
  AnalyzerJob,
  AnalyzerType,
  DocumentRecord,
  JobQueueSummary,
  JobStatus,
} from "../types";

// 6 jobs across the 3 analyzers and the 5 statuses (2 completed, 1 in_progress,
// 1 pending, 1 failed, 1 cancelled). The dashboard breakdown is derived from
// this list so the numbers are always consistent.
function iso(daysAgo: number, hoursAgo = 0, minutesAgo = 0): string {
  return new Date(
    Date.now() -
      daysAgo * 86_400_000 -
      hoursAgo * 3_600_000 -
      minutesAgo * 60_000,
  ).toISOString();
}

export const JOBS: AnalyzerJob[] = [
  {
    id: "JOB-9821",
    analyzer: "credit_report",
    status: "completed",
    applicationId: "APP-48213",
    createdAt: iso(8),
    finishedAt: iso(8, -1), // finished 1h after created
    documentIds: ["doc-1"],
  },
  {
    id: "JOB-9822",
    analyzer: "bank_statement",
    status: "completed",
    applicationId: "APP-48213",
    createdAt: iso(4),
    finishedAt: iso(4, -2),
    documentIds: ["doc-2"],
  },
  {
    id: "JOB-9831",
    analyzer: "id_validation",
    status: "in_progress",
    applicationId: "APP-48207",
    createdAt: iso(0, 0, 5),
    documentIds: ["doc-3"],
  },
  {
    id: "JOB-9833",
    analyzer: "bank_statement",
    status: "pending",
    applicationId: "APP-48219",
    createdAt: iso(0, 0, 1),
    documentIds: [],
  },
  {
    id: "JOB-9810",
    analyzer: "credit_report",
    status: "completed",
    applicationId: "APP-48205",
    createdAt: iso(1, 4),
    finishedAt: iso(1, 3),
    documentIds: ["doc-4"],
  },
  {
    id: "JOB-9805",
    analyzer: "id_validation",
    status: "cancelled",
    applicationId: "APP-48199",
    createdAt: iso(2, 6),
    finishedAt: iso(2, 5),
    documentIds: [],
  },
];

export const DOCUMENTS: DocumentRecord[] = [
  {
    id: "doc-1",
    name: "credit_report_marisol_trevino.pdf",
    mime: "application/pdf",
    sizeBytes: 1_242_880,
    uploadedAt: iso(8, 1),
    jobId: "JOB-9821",
    analyzer: "credit_report",
  },
  {
    id: "doc-2",
    name: "bank_statement_jan_2026.pdf",
    mime: "application/pdf",
    sizeBytes: 2_411_724,
    uploadedAt: iso(4, 2),
    jobId: "JOB-9822",
    analyzer: "bank_statement",
  },
  {
    id: "doc-3",
    name: "drivers_license_andre_okafor.jpg",
    mime: "image/jpeg",
    sizeBytes: 487_321,
    uploadedAt: iso(0, 6),
    jobId: "JOB-9831",
    analyzer: "id_validation",
  },
  {
    id: "doc-4",
    name: "bank_statement_dec_2025.pdf",
    mime: "application/pdf",
    sizeBytes: 2_086_104,
    uploadedAt: iso(5),
  },
];

export function summarize(jobs: AnalyzerJob[]): JobQueueSummary {
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
  for (const j of jobs) {
    byStatus[j.status]++;
    byAnalyzer[j.analyzer]++;
  }
  const recent = [...jobs]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);

  // 7-day rolling series for the dashboard sparkline. Bucket job createdAt
  // by calendar day; days with no jobs land as zero. With a 6-job mock the
  // shape is sparse on purpose — real backends will fill in.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailySeries: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today.getTime() - i * 86_400_000);
    const dayStart = day.getTime();
    const dayEnd = dayStart + 86_400_000;
    const count = jobs.filter((j) => {
      const t = Date.parse(j.createdAt);
      return t >= dayStart && t < dayEnd;
    }).length;
    dailySeries.push({ date: day.toISOString().slice(0, 10), count });
  }

  // Per-analyzer health roll-up: if any active jobs today → "active", any
  // failed today → "degraded", else operational. Today-only window keeps the
  // signal fresh; older failures shouldn't keep the indicator hot.
  const todayStart = today.getTime();
  const analyzerHealth: Record<AnalyzerType, "operational" | "active" | "degraded"> = {
    credit_report: "operational",
    bank_statement: "operational",
    id_validation: "operational",
  };
  for (const j of jobs) {
    if (Date.parse(j.createdAt) < todayStart) continue;
    if (j.status === "failed") analyzerHealth[j.analyzer] = "degraded";
    else if (
      analyzerHealth[j.analyzer] === "operational" &&
      (j.status === "in_progress" || j.status === "pending")
    ) {
      analyzerHealth[j.analyzer] = "active";
    }
  }

  return {
    total: jobs.length,
    byStatus,
    byAnalyzer,
    dailySeries,
    analyzerHealth,
    recent,
  };
}
