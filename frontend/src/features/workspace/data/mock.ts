import type {
  AnalyzerJob,
  AnalyzerType,
  DocumentRecord,
  JobQueueSummary,
  JobRun,
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

// Detailed ID validation runs for the JobRun shape: one verified completion
// (six calls, full result) and one failure (vision step timed out, no result).
// These drive the Job Detail / result viewer screens; the flat JOBS list above
// keeps powering the dashboard summary.
export const ID_RUNS: JobRun[] = [
  {
    id: "JOB-7001",
    analyzer: "id_validation",
    status: "completed",
    applicationId: "APP-48207",
    createdAt: iso(0, 3),
    startedAt: iso(0, 3, -1),
    finishedAt: iso(0, 3, -1),
    documentIds: ["doc-3"],
    request: {
      documentType: "id_validation",
      applicationId: "APP-48207",
      attachments: ["doc-3"],
      losData: { fullName: "Andre Okafor", dateOfBirth: "1989-04-12" },
    },
    statusHistory: [
      { status: "pending", at: iso(0, 3) },
      { status: "in_progress", at: iso(0, 3, -1) },
      { status: "completed", at: iso(0, 3, -1) },
    ],
    calls: [
      {
        step: "ingest",
        label: "Ingest + document-type & image-quality detection",
        durationMs: 180,
        inputTokens: 0,
        outputTokens: 0,
        success: true,
      },
      {
        step: "classify",
        label: "Classification (type, country/state, layout)",
        model: "claude-sonnet-4-6",
        durationMs: 2140,
        inputTokens: 1820,
        outputTokens: 95,
        success: true,
      },
      {
        step: "extract",
        label: "Field extraction",
        model: "claude-sonnet-4-6",
        durationMs: 3260,
        inputTokens: 1980,
        outputTokens: 240,
        success: true,
      },
      {
        step: "authenticity",
        label: "Authenticity / verification (MRZ checksum + consistency)",
        model: "claude-sonnet-4-6",
        durationMs: 2890,
        inputTokens: 1760,
        outputTokens: 180,
        success: true,
      },
      {
        step: "cross_check",
        label: "Cross-check vs LOS application data",
        durationMs: 60,
        inputTokens: 0,
        outputTokens: 0,
        success: true,
      },
      {
        step: "eligibility_features",
        label: "Emit eligibility features",
        durationMs: 40,
        inputTokens: 0,
        outputTokens: 0,
        success: true,
      },
    ],
    response: {
      fields: {
        fullName: "Andre Okafor",
        dateOfBirth: "1989-04-12",
        documentNumber: "D1234567",
        issueDate: "2021-06-01",
        expiryDate: "2029-04-12",
        address: "482 Lakeview Dr, Austin, TX 78701",
        country: "US",
        state: "TX",
        documentKind: "drivers_license",
      },
      checks: [
        { name: "expiry", status: "pass", detail: "Valid through 2029-04-12" },
        { name: "mrz_checksum", status: "not_applicable", detail: "No MRZ on a US driver's license" },
        { name: "field_consistency", status: "pass", detail: "Issue precedes expiry; formats valid" },
        { name: "authenticity", status: "pass", detail: "No tampering signals detected" },
        { name: "name_match", status: "pass", detail: "Exact match to LOS applicant" },
        { name: "dob_match", status: "pass", detail: "Exact match to LOS applicant" },
      ],
      verdict: "verified",
      confidence: 0.94,
      calls: [],
    },
    errors: [],
  },
  {
    id: "JOB-7002",
    analyzer: "id_validation",
    status: "failed",
    applicationId: "APP-48231",
    createdAt: iso(1, 2),
    startedAt: iso(1, 2, -1),
    finishedAt: iso(1, 2, -2),
    documentIds: ["doc-5"],
    request: {
      documentType: "id_validation",
      applicationId: "APP-48231",
      attachments: ["doc-5"],
      losData: { fullName: "Priya Nair", dateOfBirth: "1994-11-23" },
    },
    statusHistory: [
      { status: "pending", at: iso(1, 2) },
      { status: "in_progress", at: iso(1, 2, -1) },
      { status: "failed", at: iso(1, 2, -2), note: "Vision call exhausted retries" },
    ],
    calls: [
      {
        step: "ingest",
        label: "Ingest + document-type & image-quality detection",
        durationMs: 210,
        inputTokens: 0,
        outputTokens: 0,
        success: true,
      },
      {
        step: "classify",
        label: "Classification (type, country/state, layout)",
        model: "claude-sonnet-4-6",
        durationMs: 64200,
        inputTokens: 1790,
        outputTokens: 0,
        success: false,
        error: "Claude vision call exhausted retries (529 overloaded)",
      },
    ],
    errors: ["Classification step failed: Claude vision call exhausted retries (529 overloaded)"],
  },
];
