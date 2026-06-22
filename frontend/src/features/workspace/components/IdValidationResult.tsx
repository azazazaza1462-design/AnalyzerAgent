import { AlertCircle, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentType, IdentityDocumentResult } from "../types";

const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  national_id: "National ID",
  passport: "Passport",
  drivers_license: "Driver's license",
  residence_permit: "Residence permit",
  unknown: "Unknown",
};

export function IdValidationResultView({ result }: { result: IdentityDocumentResult }) {
  const pct = Math.round(Math.max(0, Math.min(1, result.overallConfidence)) * 100);
  const review = result.requiresManualReview;
  const gate = review
    ? { label: "Needs manual review", fill: "bg-ew-warning-text", text: "text-ew-warning-text" }
    : { label: "Verified", fill: "bg-ew-success-text", text: "text-ew-success-text" };
  const fullName = [result.firstName, result.lastName].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-6">
      {/* Manual-review gate + confidence */}
      <div className="space-y-2.5 rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-4">
        <div className="flex items-baseline justify-between">
          <span className={cn("text-[16px] font-medium", gate.text)}>{gate.label}</span>
          <span className="text-[13px] tabular-nums text-ew-text-tertiary">{pct}% confidence</span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-ew-bg-secondary"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={cn("h-full rounded-full transition-[width]", gate.fill)} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Review reasons */}
      {review && result.reviewReasons.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
            Why this needs review
          </h3>
          <ul className="divide-y divide-ew-border overflow-hidden rounded-xl border-[0.5px] border-ew-border">
            {result.reviewReasons.map((r, i) => (
              <li key={i} className="flex items-start gap-3 bg-ew-bg-primary px-4 py-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-ew-warning-text" />
                <span className="text-[13px] text-ew-text-secondary">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted fields */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
          Extracted fields
        </h3>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-[13px] sm:grid-cols-2">
          <Field label="Name" value={fullName} />
          <Field label="Date of birth" value={result.dateOfBirth} />
          <Field label="Document #" value={result.documentNumber} />
          <Field label="Document type" value={DOC_TYPE_LABEL[result.documentType]} />
          <Field label="Nationality" value={result.nationality} />
          <Field label="Issuing country" value={result.issuingCountry} />
          <Field label="Sex" value={result.sex} />
          <Field label="Expiry date" value={result.dateOfExpiry} />
        </dl>
      </div>

      {/* Legibility notes (informational — does not force review) */}
      {result.legibilityNotes && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
            Legibility notes
          </h3>
          <p className="rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary px-4 py-3 text-[13px] text-ew-text-secondary">
            {result.legibilityNotes}
          </p>
        </div>
      )}

      {/* MRZ verification */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
          MRZ verification
        </h3>
        <ul className="divide-y divide-ew-border overflow-hidden rounded-xl border-[0.5px] border-ew-border">
          <MrzRow valid={result.mrzChecksumValid} hasMrz={Boolean(result.machineReadableZone)} />
        </ul>
      </div>
    </div>
  );
}

function MrzRow({ valid, hasMrz }: { valid?: boolean | null; hasMrz: boolean }) {
  const meta =
    valid === true
      ? { Icon: CheckCircle2, cls: "text-ew-success-text", label: "Pass", detail: "MRZ check digits valid (TD3)." }
      : valid === false
        ? { Icon: XCircle, cls: "text-ew-danger-text", label: "Fail", detail: "MRZ check digits do not validate." }
        : {
            Icon: MinusCircle,
            cls: "text-ew-text-tertiary",
            label: "N/A",
            detail: hasMrz ? "MRZ present but not a recognised layout." : "No machine-readable zone present.",
          };
  const Icon = meta.Icon;
  return (
    <li className="flex items-start gap-3 bg-ew-bg-primary px-4 py-3">
      <Icon className={cn("mt-0.5 size-4 shrink-0", meta.cls)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-ew-text-primary">MRZ checksum</span>
          <span className={cn("shrink-0 text-[12px] font-medium", meta.cls)}>{meta.label}</span>
        </div>
        <p className="mt-0.5 text-[12px] text-ew-text-tertiary">{meta.detail}</p>
      </div>
    </li>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] uppercase tracking-wide text-ew-text-tertiary">{label}</dt>
      <dd className="text-ew-text-primary">{value || "—"}</dd>
    </div>
  );
}
