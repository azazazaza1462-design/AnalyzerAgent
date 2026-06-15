import { useJobDecision } from "../hooks/useJobs";
import type { JobRun } from "../types";

// Which extracted field(s) each check traces back to — makes the decision
// auditable end-to-end.
const CHECK_SOURCE: Record<string, string> = {
  expiry: "expiryDate",
  mrz_checksum: "MRZ line",
  field_consistency: "issueDate + expiryDate",
  authenticity: "document image",
  name_match: "fullName ↔ LOS name",
  dob_match: "dateOfBirth ↔ LOS DOB",
};

const CHECK_LABEL: Record<string, string> = {
  expiry: "Expiry",
  mrz_checksum: "MRZ checksum",
  field_consistency: "Field consistency",
  authenticity: "Authenticity",
  name_match: "Name match",
  dob_match: "DOB match",
};

interface Stage {
  stage: string;
  title: string;
  detail?: string;
  items?: string[];
}

// Renders the lineage of an ID decision so a reviewer can trace the verdict
// back to its evidence: document → extraction → checks → eligibility → verdict
// → decision. Built entirely from data the run already persists.
export function ProvenancePanel({ run }: { run: JobRun }) {
  const { data: decision } = useJobDecision(run.id);
  const result = run.response;
  if (!result) {
    return <p className="text-[13px] text-ew-text-tertiary">Available once the run completes.</p>;
  }

  const extract = run.calls.find((c) => c.step === "extract");
  const f = result.fields;

  const stages: Stage[] = [
    {
      stage: "Source",
      title: `${run.documentIds.length} document${run.documentIds.length === 1 ? "" : "s"}`,
      detail: "Uploaded to the LOS and downloaded by the agent for analysis.",
    },
    {
      stage: "Extraction",
      title: "Fields read from the document",
      detail: extract
        ? `Claude ${extract.model ?? "vision"} · ${extract.inputTokens}/${extract.outputTokens} tok · ${(extract.durationMs / 1000).toFixed(1)}s`
        : undefined,
      items: [
        f.fullName && `name: ${f.fullName}`,
        f.dateOfBirth && `dob: ${f.dateOfBirth}`,
        f.documentNumber && `doc #: ${f.documentNumber}`,
        f.expiryDate && `expiry: ${f.expiryDate}`,
      ].filter(Boolean) as string[],
    },
    {
      stage: "Validation",
      title: "Checks",
      items: result.checks.map(
        (c) =>
          `${CHECK_LABEL[c.name] ?? c.name}: ${c.status.replace("_", " ")} — from ${CHECK_SOURCE[c.name] ?? "document"}`,
      ),
    },
  ];

  if (result.eligibility) {
    stages.push({
      stage: "Eligibility model",
      title: `${result.eligibility.verdict.replace("_", " ")} · ${Math.round(result.eligibility.score * 100)}%`,
      detail: `${result.eligibility.modelVersion}`,
      items: result.eligibility.contributions.map(
        (c) => `${c.feature.replace(/_/g, " ")}: ${c.contribution >= 0 ? "+" : ""}${c.contribution.toFixed(2)}`,
      ),
    });
  }

  stages.push({
    stage: "Verdict",
    title: `${result.verdict.replace("_", " ")} · ${Math.round(result.confidence * 100)}% confidence`,
  });

  stages.push({
    stage: "Reviewer decision",
    title: decision ? decision.outcome : "Pending",
    detail: decision?.reviewedBy ? `by ${decision.reviewedBy}` : undefined,
  });

  return (
    <ol className="relative ml-1 space-y-0 border-l-[0.5px] border-ew-border pl-5">
      {stages.map((s, i) => (
        <li key={i} className="relative pb-5 last:pb-0">
          <span className="absolute -left-[23px] top-1.5 size-2.5 rounded-full bg-ew-text-tertiary ring-4 ring-ew-bg-secondary" />
          <div className="text-[11px] uppercase tracking-wide text-ew-text-tertiary">{s.stage}</div>
          <div className="text-[14px] font-medium capitalize text-ew-text-primary">{s.title}</div>
          {s.detail && <div className="font-mono text-[11px] text-ew-text-tertiary">{s.detail}</div>}
          {s.items && s.items.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {s.items.map((it, j) => (
                <li key={j} className="text-[12px] text-ew-text-secondary">
                  {it}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
