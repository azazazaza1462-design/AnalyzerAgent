// Types mirror the eventual API contract. Treat any reshape here as a
// breaking-change discussion with the backend before changing field names.

export type Verdict = "eligible" | "conditional" | "ineligible" | "pending";
export type ParityStatus = "agreement" | "divergence" | "pending";
export type ModelMode = "parallel_signal" | "fallback" | "validation_layer";
export type DimResult = "pass" | "borderline" | "fail";
export type FindingImpact =
  | "strong_positive"
  | "positive"
  | "moderate_negative"
  | "strong_negative"
  | "data_gap";

export interface Application {
  id: string;
  borrowerName: string;
  product: string;
  amount: number;
}

export interface EvidenceRef {
  label: string;
  icon: string;
  documentId?: string;
}

export interface ProvenanceChain {
  sourceDocument: { name: string; page?: number; uploadedAt: string };
  extractedValue: { label: string; value: string; ocrConfidence: number };
  modelFeature: { name: string; value: string; threshold?: string };
  finding: { summary: string };
  evidenceSnippet: { lines: string[]; highlightIndex: number };
}

export interface Finding {
  id: string;
  title: string;
  detail: string;
  impact: FindingImpact;
  sources: EvidenceRef[];
  provenance?: ProvenanceChain;
}

export interface DivergenceDetail {
  dimension: string;
  ai: { method: string; input: string; result: string; status: DimResult };
  rules: { method: string; input: string; result: string; status: DimResult };
  explanation: string;
}

export interface ParityComparison {
  status: ParityStatus;
  dimensions: { name: string; ai: DimResult; rules: DimResult }[];
  divergences: DivergenceDetail[];
}

export interface EligibilityAssessment {
  application: Application;
  verdict: Verdict;
  confidence: number;
  modelVersion: string;
  mode: ModelMode;
  runAt: string;
  parity: ParityComparison;
  findings: Finding[];
}

export interface OverrideDecision {
  applicationId: string;
  // Dimension this decision targets. Undefined for application-level decisions
  // (e.g., opened from the assessment action bar); set when the underwriter
  // enters the modal from a specific divergence reconciliation.
  dimension?: string;
  decision: "accept" | "override";
  resolution?: string;
  reasonCode: string;
  rationale: string;
  recordedBy: string;
  recordedAt: string;
  modelRunHash: string;
}

export interface ModelGovernance {
  version: string;
  inProduction: boolean;
  pipelineStatus: "operational" | "degraded" | "down";
  lastRetrainDays: number;
  parityRate: number;
  driftPsi: number;
  fairness: {
    tolerancePts: number;
    lastAuditAt: string;
    groups: { group: string; approvalRate: number }[];
  };
}
