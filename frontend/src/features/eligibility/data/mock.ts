import type {
  EligibilityAssessment,
  ModelGovernance,
  OverrideDecision,
} from "../types";

// === Anchor case: APP-48213 — residual-income divergence ============================
// This is the full case used in the spec walkthrough. Rules engine flags borderline
// residual income; AI model passes with caveats. Used to drive screens 2-5.
export const APP_48213: EligibilityAssessment = {
  application: {
    id: "APP-48213",
    borrowerName: "Marisol Treviño",
    product: "Conventional 30y fixed",
    amount: 412_000,
  },
  verdict: "conditional",
  confidence: 0.78,
  modelVersion: "v2.3",
  mode: "parallel_signal",
  runAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  parity: {
    status: "divergence",
    dimensions: [
      { name: "Credit history", ai: "pass", rules: "pass" },
      { name: "DTI", ai: "pass", rules: "pass" },
      { name: "Residual income", ai: "pass", rules: "borderline" },
      { name: "Employment stability", ai: "pass", rules: "pass" },
      { name: "Collateral", ai: "pass", rules: "pass" },
    ],
    divergences: [
      {
        dimension: "Residual income",
        ai: {
          method: "Cash-flow inference",
          input: "12mo bank statements",
          result: "$2,840 / month",
          status: "pass",
        },
        rules: {
          method: "Static formula (gross income − fixed obligations)",
          input: "Verified pay stub + credit report",
          result: "$1,910 / month",
          status: "borderline",
        },
        explanation:
          "The rules engine subtracts a fixed obligations bucket from declared gross income. The model reconstructs realised cash flow from 12 months of statements, which captures recurring secondary income (rental + side contracts) absent from the pay stub. Both signals are technically valid; the model's view is closer to actual post-expense capacity but rests on cash-flow inference, which a hardened policy may not yet accept.",
      },
    ],
  },
  findings: [
    {
      id: "F-1",
      title: "Stable employment history",
      detail: "5 years at current employer with steady annual increases.",
      impact: "strong_positive",
      sources: [
        { label: "Employment letter · p.1", icon: "building-2" },
        { label: "Pay stubs · 6mo", icon: "file-text" },
      ],
    },
    {
      id: "F-2",
      title: "Residual income above floor",
      detail:
        "Inferred cash flow shows $2,840/mo residual income, above the $1,800 policy floor.",
      impact: "positive",
      sources: [
        { label: "Bank statements · 12mo", icon: "file-text" },
        { label: "Cash-flow model", icon: "variable" },
      ],
      provenance: {
        sourceDocument: {
          name: "Bank statement — Operating · Jan 2026.pdf",
          page: 3,
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        },
        extractedValue: {
          label: "Average monthly inflow (recurring)",
          value: "$11,420",
          ocrConfidence: 0.93,
        },
        modelFeature: {
          name: "residual_income_monthly",
          value: "$2,840",
          threshold: "≥ $1,800 (policy floor)",
        },
        finding: { summary: "Residual income exceeds policy floor by $1,040/month." },
        evidenceSnippet: {
          lines: [
            "01/14  PAYROLL DEPOSIT  EMPLOYER LLC          +4,820.00",
            "01/14  RENT INCOME  TENANT  306                +2,400.00",
            "01/15  ACH TRANSFER  CONTRACTOR REVENUE        +1,950.00",
            "01/16  ZELLE FROM  J. TREVINO                  +   250.00",
            "01/17  PURCHASE  COSTCO #421                   −   312.40",
          ],
          highlightIndex: 1,
        },
      },
    },
    {
      id: "F-3",
      title: "Residual income — divergence with rules engine",
      detail:
        "Rules engine marks borderline using static formula; model marks pass using cash-flow inference.",
      impact: "moderate_negative",
      sources: [
        { label: "Pay stub · p.1", icon: "file-text" },
        { label: "Bank statements · 12mo", icon: "file-text" },
      ],
    },
    {
      id: "F-4",
      title: "Address history not corroborated by utility records",
      detail:
        "Utility-bill data unavailable in third-party feed for declared prior address.",
      impact: "data_gap",
      sources: [{ label: "Utility lookup · unavailable", icon: "circle-help" }],
    },
    {
      id: "F-5",
      title: "Credit profile",
      detail: "FICO 742, no derogatories in 24 months, 11% utilization.",
      impact: "positive",
      sources: [{ label: "Credit report · p.1-2", icon: "file-text" }],
    },
  ],
};

// === Lighter records to populate the queue =============================================
export const QUEUE_ITEMS: EligibilityAssessment[] = [
  APP_48213,
  {
    application: {
      id: "APP-48207",
      borrowerName: "Andre Okafor",
      product: "FHA 30y fixed",
      amount: 287_500,
    },
    verdict: "eligible",
    confidence: 0.91,
    modelVersion: "v2.3",
    mode: "parallel_signal",
    runAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    parity: { status: "agreement", dimensions: [], divergences: [] },
    findings: [],
  },
  {
    application: {
      id: "APP-48219",
      borrowerName: "Priya Raman",
      product: "Conventional 15y fixed",
      amount: 525_000,
    },
    verdict: "conditional",
    confidence: 0.69,
    modelVersion: "v2.3",
    mode: "parallel_signal",
    runAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    parity: {
      status: "divergence",
      dimensions: [],
      divergences: [
        {
          dimension: "DTI",
          ai: { method: "Inferred", input: "Bank statements", result: "39%", status: "borderline" },
          rules: { method: "Declared", input: "Application form", result: "44%", status: "fail" },
          explanation: "",
        },
      ],
    },
    findings: [],
  },
  {
    application: {
      id: "APP-48224",
      borrowerName: "Daniel Vega",
      product: "Jumbo 30y fixed",
      amount: 1_120_000,
    },
    verdict: "ineligible",
    confidence: 0.88,
    modelVersion: "v2.3",
    mode: "parallel_signal",
    runAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    parity: { status: "agreement", dimensions: [], divergences: [] },
    findings: [],
  },
  {
    application: {
      id: "APP-48231",
      borrowerName: "Hiroshi Tanaka",
      product: "Conventional 30y fixed",
      amount: 348_000,
    },
    verdict: "pending",
    confidence: 0,
    modelVersion: "v2.3",
    mode: "parallel_signal",
    runAt: new Date().toISOString(),
    parity: { status: "pending", dimensions: [], divergences: [] },
    findings: [],
  },
];

// === Override decisions store (in-memory, by applicationId) ============================
const OVERRIDES = new Map<string, OverrideDecision>();
export function getOverride(applicationId: string): OverrideDecision | undefined {
  return OVERRIDES.get(applicationId);
}
export function recordOverride(decision: OverrideDecision): void {
  OVERRIDES.set(decision.applicationId, decision);
}

// === Model governance snapshot =========================================================
export const MODEL_GOVERNANCE: ModelGovernance = {
  version: "v2.3",
  inProduction: true,
  pipelineStatus: "operational",
  lastRetrainDays: 27,
  parityRate: 0.94,
  driftPsi: 0.07,
  fairness: {
    tolerancePts: 5,
    lastAuditAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    groups: [
      { group: "Group A", approvalRate: 0.71 },
      { group: "Group B", approvalRate: 0.68 },
      { group: "Group C", approvalRate: 0.69 },
    ],
  },
};

export const REASON_CODES = [
  { code: "MODEL_OUT_OF_SCOPE", label: "Model out of scope for product" },
  { code: "POLICY_OVERRIDE", label: "Policy override (documented exception)" },
  { code: "DATA_QUALITY", label: "Data quality concern" },
  { code: "COMPENSATING_FACTORS", label: "Compensating factors not captured" },
  { code: "REGULATORY", label: "Regulatory requirement" },
];
