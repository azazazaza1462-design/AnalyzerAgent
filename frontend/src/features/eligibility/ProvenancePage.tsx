import { useParams, Link } from "react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  CircleHelp,
  FileText,
  ScanLine,
  Variable,
  Flag,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "./components/AppHeader";
import { EligibilityShell } from "./components/EligibilityShell";
import { TraceStep } from "./components/TraceStep";
import { StatusPill } from "./components/StatusPill";
import { Skeleton } from "./components/Skeleton";
import { useAssessment } from "./hooks/useAssessment";
import { formatDate } from "./utils";

export default function ProvenancePage() {
  const { id, fid } = useParams<{ id: string; fid: string }>();
  const assessment = useAssessment(id);
  const a = assessment.data;
  const finding = a?.findings.find((f) => f.id === fid);
  const chain = finding?.provenance;

  return (
    <EligibilityShell>
      <AppHeader
        crumbs={[
          { label: "Viewnear" },
          { label: "Underwriting workbench", href: "/underwriting/queue" },
          { label: "Eligibility queue", href: "/underwriting/queue" },
          {
            label: a?.application.id ?? id ?? "—",
            href: `/underwriting/app/${id}/eligibility`,
          },
          { label: "Provenance" },
        ]}
        app={a?.application}
      />

      <div className="mb-6">
        <Link
          to={`/underwriting/app/${id}/eligibility`}
          className="inline-flex items-center gap-1.5 text-[12px] text-ew-text-secondary transition-colors hover:text-ew-text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Back to assessment
        </Link>
      </div>

      {assessment.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      ) : !finding ? (
        <div className="rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary px-5 py-10 text-center text-[14px] text-ew-text-tertiary">
          Finding not found.
        </div>
      ) : !chain ? (
        <div className="rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary px-5 py-10 text-center text-[14px] text-ew-text-tertiary">
          No provenance trace recorded for this finding.
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-5">
            <div className="space-y-1">
              <span className="text-[12px] text-ew-text-tertiary">Finding</span>
              <h1 className="text-[22px] font-medium text-ew-text-primary">
                {finding.title}
              </h1>
              <p className="text-[14px] text-ew-text-secondary">{finding.detail}</p>
            </div>
          </div>

          <section className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="mb-5 text-[18px] font-medium text-ew-text-primary">
                Trace
              </h2>
              <div>
                <TraceStep
                  index={1}
                  title="Source document"
                  caption={
                    <>
                      <div>{chain.sourceDocument.name}</div>
                      <div className="text-ew-text-tertiary">
                        Page {chain.sourceDocument.page ?? "—"} · Uploaded{" "}
                        {formatDate(chain.sourceDocument.uploadedAt)}
                      </div>
                    </>
                  }
                  icon={<FileText className="size-4 text-ew-text-secondary" strokeWidth={1.75} />}
                />
                <TraceStep
                  index={2}
                  title="Extracted value"
                  caption={
                    <>
                      <div>
                        <span className="text-ew-text-tertiary">
                          {chain.extractedValue.label}:
                        </span>{" "}
                        <span className="font-medium text-ew-text-primary">
                          {chain.extractedValue.value}
                        </span>
                      </div>
                      <div className="mt-1">
                        <OcrConfidence value={chain.extractedValue.ocrConfidence} />
                      </div>
                    </>
                  }
                  icon={<ScanLine className="size-4 text-ew-text-secondary" strokeWidth={1.75} />}
                  variant={chain.extractedValue.ocrConfidence < 0.85 ? "muted" : "default"}
                />
                <TraceStep
                  index={3}
                  title="Model feature"
                  caption={
                    <>
                      <div>
                        <span className="text-ew-text-tertiary">
                          {chain.modelFeature.name}:
                        </span>{" "}
                        <span className="font-medium text-ew-text-primary">
                          {chain.modelFeature.value}
                        </span>
                      </div>
                      {chain.modelFeature.threshold && (
                        <div className="text-ew-text-tertiary">
                          Threshold {chain.modelFeature.threshold}
                        </div>
                      )}
                    </>
                  }
                  icon={<Variable className="size-4 text-ew-text-secondary" strokeWidth={1.75} />}
                  variant="active"
                />
                <TraceStep
                  index={4}
                  title="Finding"
                  caption={chain.finding.summary}
                  icon={<Flag className="size-4 text-ew-text-secondary" strokeWidth={1.75} />}
                  isLast
                />
              </div>
            </div>

            <div>
              <h2 className="mb-5 text-[18px] font-medium text-ew-text-primary">
                Evidence snippet
              </h2>
              <div className="rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-4">
                <div className="mb-3 flex items-center gap-2 text-[12px] text-ew-text-tertiary">
                  <FileText className="size-3.5" />
                  <span>{chain.sourceDocument.name}</span>
                  <span aria-hidden>·</span>
                  <span>p.{chain.sourceDocument.page}</span>
                </div>
                <ol className="space-y-1 rounded-md bg-ew-bg-tertiary p-3 font-mono text-[12px]">
                  {chain.evidenceSnippet.lines.map((line, i) => {
                    const isHighlight = i === chain.evidenceSnippet.highlightIndex;
                    return (
                      <li
                        key={i}
                        className={cn(
                          "flex items-start gap-2 rounded-sm px-2 py-1",
                          isHighlight && "bg-ew-warning-bg text-ew-warning-text",
                        )}
                      >
                        {isHighlight && (
                          <ArrowRight className="mt-0.5 size-3 shrink-0" aria-hidden />
                        )}
                        <span className={cn(!isHighlight && "text-ew-text-secondary")}>
                          {line}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      toast.info("Open full document", {
                        description: "Mock action — would launch the document viewer.",
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary px-2.5 py-1 text-[12px] font-medium text-ew-text-primary transition-colors hover:border-ew-border-strong"
                  >
                    <ExternalLink className="size-3.5" />
                    Open full document
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      toast.info("Dispute filed", {
                        description: "Mock action — would flag the extraction for review.",
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium text-ew-warning-text transition-colors hover:bg-ew-warning-bg/40"
                  >
                    <CircleHelp className="size-3.5" />
                    Dispute extraction
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </EligibilityShell>
  );
}

function OcrConfidence({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.9 ? "success" : value >= 0.75 ? "warning" : "danger";
  return (
    <StatusPill tone={tone}>
      OCR confidence {pct}%
    </StatusPill>
  );
}
