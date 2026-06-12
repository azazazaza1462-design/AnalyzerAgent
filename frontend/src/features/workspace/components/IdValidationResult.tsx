import { AlertCircle, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckStatus, IdCheck, IdValidationResult, IdVerdict } from "../types";

const VERDICT: Record<IdVerdict, { label: string; fill: string; text: string }> = {
  verified: { label: "Verified", fill: "bg-ew-success-text", text: "text-ew-success-text" },
  needs_review: { label: "Needs review", fill: "bg-ew-warning-text", text: "text-ew-warning-text" },
  rejected: { label: "Rejected", fill: "bg-ew-danger-text", text: "text-ew-danger-text" },
};

const CHECK: Record<CheckStatus, { Icon: typeof CheckCircle2; cls: string; label: string }> = {
  pass: { Icon: CheckCircle2, cls: "text-ew-success-text", label: "Pass" },
  fail: { Icon: XCircle, cls: "text-ew-danger-text", label: "Fail" },
  borderline: { Icon: AlertCircle, cls: "text-ew-warning-text", label: "Borderline" },
  not_applicable: { Icon: MinusCircle, cls: "text-ew-text-tertiary", label: "N/A" },
};

const CHECK_LABEL: Record<string, string> = {
  expiry: "Expiry",
  mrz_checksum: "MRZ checksum",
  field_consistency: "Field consistency",
  authenticity: "Authenticity",
  name_match: "Name match",
  dob_match: "Date of birth match",
};

export function IdValidationResultView({ result }: { result: IdValidationResult }) {
  const v = VERDICT[result.verdict];
  const pct = Math.round(Math.max(0, Math.min(1, result.confidence)) * 100);
  const f = result.fields;

  return (
    <div className="space-y-6">
      {/* Verdict + confidence */}
      <div className="space-y-2.5 rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-4">
        <div className="flex items-baseline justify-between">
          <span className={cn("text-[16px] font-medium", v.text)}>{v.label}</span>
          <span className="text-[13px] tabular-nums text-ew-text-tertiary">{pct}% confidence</span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-ew-bg-secondary"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={cn("h-full rounded-full transition-[width]", v.fill)} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Extracted fields */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
          Extracted fields
        </h3>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-[13px] sm:grid-cols-2">
          <Field label="Name" value={f.fullName} />
          <Field label="Date of birth" value={f.dateOfBirth} />
          <Field label="Document #" value={f.documentNumber} />
          <Field label="Document kind" value={f.documentKind} />
          <Field label="Issue date" value={f.issueDate} />
          <Field label="Expiry date" value={f.expiryDate} />
          <Field label="Country / state" value={[f.country, f.state].filter(Boolean).join(" / ") || undefined} />
          <Field label="Address" value={f.address} />
        </dl>
      </div>

      {/* Validation checks */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
          Validation checks
        </h3>
        <ul className="divide-y divide-ew-border overflow-hidden rounded-xl border-[0.5px] border-ew-border">
          {result.checks.map((c, i) => (
            <CheckRow key={i} check={c} />
          ))}
          {result.checks.length === 0 && (
            <li className="px-4 py-3 text-[13px] text-ew-text-tertiary">No checks recorded.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: IdCheck }) {
  const meta = CHECK[check.status];
  const Icon = meta.Icon;
  return (
    <li className="flex items-start gap-3 bg-ew-bg-primary px-4 py-3">
      <Icon className={cn("mt-0.5 size-4 shrink-0", meta.cls)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-ew-text-primary">
            {CHECK_LABEL[check.name] ?? check.name}
          </span>
          <span className={cn("shrink-0 text-[12px] font-medium", meta.cls)}>{meta.label}</span>
        </div>
        {check.detail && <p className="mt-0.5 text-[12px] text-ew-text-tertiary">{check.detail}</p>}
      </div>
    </li>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] uppercase tracking-wide text-ew-text-tertiary">{label}</dt>
      <dd className="text-ew-text-primary">{value || "—"}</dd>
    </div>
  );
}
