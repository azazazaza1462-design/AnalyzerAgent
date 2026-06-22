import { useJobDecision } from "../hooks/useJobs";
import type { JobRun } from "../types";

interface Stage {
  stage: string;
  title: string;
  detail?: string;
  items?: string[];
}

// Renders the lineage of an ID decision so a reviewer can trace the outcome back
// to its evidence: document → extraction → MRZ checksum → manual-review gate →
// reviewer decision. Built entirely from data the run already persists.
export function ProvenancePanel({ run }: { run: JobRun }) {
  const { data: decision } = useJobDecision(run.id);
  const result = run.response;
  if (!result) {
    return <p className="text-[13px] text-ew-text-tertiary">Available once the run completes.</p>;
  }

  const fullName = [result.firstName, result.lastName].filter(Boolean).join(" ");
  const mrz =
    result.mrzChecksumValid === true
      ? "pass — check digits valid (TD3)"
      : result.mrzChecksumValid === false
        ? "fail — check digits do not validate"
        : "n/a — no recognised MRZ";

  const stages: Stage[] = [
    {
      stage: "Source",
      title: `${run.documentIds.length} document${run.documentIds.length === 1 ? "" : "s"}`,
      detail: "Uploaded to the LOS and downloaded by the agent for analysis.",
    },
    {
      stage: "Extraction",
      title: "Fields read from the document",
      detail: `Claude vision · ${Math.round(result.overallConfidence * 100)}% confidence`,
      items: [
        fullName && `name: ${fullName}`,
        result.dateOfBirth && `dob: ${result.dateOfBirth}`,
        result.documentNumber && `doc #: ${result.documentNumber}`,
        result.dateOfExpiry && `expiry: ${result.dateOfExpiry}`,
      ].filter(Boolean) as string[],
    },
    {
      stage: "MRZ checksum",
      title: mrz,
    },
    {
      stage: "Manual-review gate",
      title: result.requiresManualReview ? "Needs manual review" : "Clean — no flags",
      items: result.reviewReasons,
    },
    {
      stage: "Reviewer decision",
      title: decision ? decision.outcome : "Pending",
      detail: decision?.reviewedBy ? `by ${decision.reviewedBy}` : undefined,
    },
  ];

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
