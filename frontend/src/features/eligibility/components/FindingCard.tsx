import {
  Building2,
  CircleHelp,
  FileText,
  IdCard,
  ScanLine,
  TrendingDown,
  TrendingUp,
  Variable,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import type { EvidenceRef, Finding, FindingImpact } from "../types";

interface FindingCardProps {
  finding: Finding;
  applicationId: string;
  // Some findings are tied to a parity divergence — exposing a "Compare with
  // rules" chip is the entry point to screen 4. The caller decides whether
  // this finding qualifies and the dimension key to link to.
  divergenceDimension?: string;
}

const IMPACT_META: Record<
  FindingImpact,
  { icon: LucideIcon; tone: string; label: string }
> = {
  strong_positive: {
    icon: TrendingUp,
    tone: "text-ew-success-text",
    label: "Strong positive",
  },
  positive: { icon: TrendingUp, tone: "text-ew-success-text", label: "Positive" },
  moderate_negative: {
    icon: TrendingDown,
    tone: "text-ew-warning-text",
    label: "Moderate concern",
  },
  strong_negative: {
    icon: TrendingDown,
    tone: "text-ew-danger-text",
    label: "Strong concern",
  },
  data_gap: { icon: CircleHelp, tone: "text-ew-text-tertiary", label: "Data gap" },
};

const EVIDENCE_ICONS: Record<string, LucideIcon> = {
  "file-text": FileText,
  "building-2": Building2,
  "id-card": IdCard,
  "scan-line": ScanLine,
  variable: Variable,
  "circle-help": CircleHelp,
};

function EvidenceChip({
  ref,
  applicationId,
  findingId,
}: {
  ref: EvidenceRef;
  applicationId: string;
  findingId: string;
}) {
  const Icon = EVIDENCE_ICONS[ref.icon] ?? FileText;
  // Evidence chips link to provenance — the spec calls these out as the entry
  // point to screen 3. If the underlying finding has no provenance chain,
  // we still render the chip (visually consistent) but make it inert.
  return (
    <Link
      to={`/underwriting/app/${applicationId}/finding/${findingId}/provenance`}
      className="inline-flex items-center gap-1.5 rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary px-2 py-1 text-[12px] text-ew-text-secondary transition-colors hover:border-ew-border-strong hover:text-ew-text-primary"
    >
      <Icon className="size-3.5 text-ew-text-tertiary" />
      <span>{ref.label}</span>
    </Link>
  );
}

export function FindingCard({
  finding,
  applicationId,
  divergenceDimension,
}: FindingCardProps) {
  const meta = IMPACT_META[finding.impact];
  const Icon = meta.icon;
  const isDataGap = finding.impact === "data_gap";

  return (
    <div
      className={cn(
        "rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-5",
        isDataGap && "opacity-80",
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md bg-ew-bg-secondary",
            meta.tone,
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3 className="text-[16px] font-medium text-ew-text-primary">
                {finding.title}
              </h3>
              <p className="text-[14px] text-ew-text-secondary">{finding.detail}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-md bg-ew-bg-secondary px-2 py-0.5 text-[12px] font-medium",
                meta.tone,
              )}
            >
              {meta.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {finding.sources.map((ref, i) => (
              <EvidenceChip
                key={`${finding.id}-src-${i}`}
                ref={ref}
                applicationId={applicationId}
                findingId={finding.id}
              />
            ))}
            {divergenceDimension && (
              <Link
                to={`/underwriting/app/${applicationId}/divergence/${encodeURIComponent(divergenceDimension)}`}
                className="inline-flex items-center gap-1.5 rounded-md border-[0.5px] border-ew-warning-text/40 bg-ew-warning-bg px-2 py-1 text-[12px] font-medium text-ew-warning-text transition-opacity hover:opacity-80"
              >
                Compare with rules
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
