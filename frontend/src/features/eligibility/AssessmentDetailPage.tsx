import { useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { Scale, TrendingUp } from "lucide-react";
import { AppHeader } from "./components/AppHeader";
import { EligibilityShell } from "./components/EligibilityShell";
import { FrameworkTabs } from "./components/FrameworkTabs";
import { VerdictCard } from "./components/VerdictCard";
import { ParityPanel } from "./components/ParityPanel";
import { FindingCard } from "./components/FindingCard";
import { MetricCard } from "./components/MetricCard";
import { ActionBar } from "./components/ActionBar";
import { OverrideModal } from "./components/OverrideModal";
import { ModelHealthBanner } from "./components/ModelHealthBanner";
import { Skeleton } from "./components/Skeleton";
import { useAssessment, useModelGovernance, useOverride } from "./hooks/useAssessment";
import { useNextInQueue } from "./hooks/useNextInQueue";
import { pipelineLabel, pipelineTone } from "./utils";

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const assessment = useAssessment(id);
  const governance = useModelGovernance();
  const overrideQuery = useOverride(id);
  const nextInQueue = useNextInQueue(id);
  const [overrideOpen, setOverrideOpen] = useState(false);

  const a = assessment.data;
  const isLoading = assessment.isLoading;

  // Map divergent dimensions to finding titles so the FindingCard can render
  // the "Compare with rules" chip on the right finding. We match by keyword,
  // which is brittle but acceptable for a mockup; the real API can attach a
  // divergence reference to each finding directly.
  const divergentDimensions = a?.parity.divergences.map((d) => d.dimension) ?? [];
  function dimensionForFinding(title: string): string | undefined {
    return divergentDimensions.find((dim) =>
      title.toLowerCase().includes(dim.toLowerCase()),
    );
  }

  const handleAccept = () => {
    setOverrideOpen(true);
  };
  const handleOverride = () => {
    setOverrideOpen(true);
  };
  const handleRerun = () => {
    toast.info("Model re-run queued", {
      description: "Mock action — would enqueue an inference job.",
    });
  };
  const handleExplain = () => {
    toast.info("Divergence explanation requested", {
      description: "Mock action — would open the SHAP-style breakdown.",
    });
  };

  return (
    <EligibilityShell>
      <AppHeader
        crumbs={[
          { label: "Viewnear" },
          { label: "Underwriting workbench", href: "/underwriting/queue" },
          {
            label: "Eligibility queue",
            href: "/underwriting/queue",
          },
          { label: a ? a.application.id : id ?? "—" },
        ]}
        app={a?.application}
      />

      <FrameworkTabs active="ai" />

      {isLoading || !a ? (
        <div className="mt-8 space-y-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-12 w-72" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <ModelHealthBanner governance={governance.data} />

          <VerdictCard assessment={a} />

          <ParityPanel assessment={a} applicationId={a.application.id} />

          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-[18px] font-medium text-ew-text-primary">Findings</h2>
                <p className="text-[14px] text-ew-text-secondary">
                  Signals driving the model verdict, with evidence pointers.
                </p>
              </div>
              <span className="text-[12px] text-ew-text-tertiary">
                {a.findings.length}{" "}
                {a.findings.length === 1 ? "finding" : "findings"}
              </span>
            </div>

            {a.findings.length === 0 ? (
              <div className="rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary px-5 py-10 text-center text-[14px] text-ew-text-tertiary">
                No findings to display.
              </div>
            ) : (
              <div className="space-y-3">
                {a.findings.map((f) => (
                  <FindingCard
                    key={f.id}
                    finding={f}
                    applicationId={a.application.id}
                    divergenceDimension={dimensionForFinding(f.title)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-[18px] font-medium text-ew-text-primary">Model context</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <MetricCard
                label="Training pipeline"
                icon={<TrendingUp className="size-3.5" strokeWidth={1.75} />}
                value={pipelineLabel(governance.data?.pipelineStatus)}
                meta={
                  governance.data
                    ? `Last retrain ${governance.data.lastRetrainDays}d ago`
                    : "—"
                }
                tone={pipelineTone(governance.data?.pipelineStatus)}
                href="/underwriting/model/eligibility"
              />
              <MetricCard
                label="Fairness controls"
                icon={<Scale className="size-3.5" strokeWidth={1.75} />}
                value={
                  governance.data
                    ? `±${governance.data.fairness.tolerancePts}pt tolerance`
                    : "—"
                }
                meta="Approval-rate parity audited"
                href="/underwriting/model/eligibility"
              />
            </div>
          </section>
        </div>
      )}

      {a && (
        <>
          <ActionBar
            mode={a.mode}
            canOverride={!overrideQuery.data}
            alreadyDecided={Boolean(overrideQuery.data)}
            hasDivergence={a.parity.status === "divergence"}
            nextHref={
              nextInQueue.nextId
                ? `/underwriting/app/${nextInQueue.nextId}/eligibility`
                : undefined
            }
            remainingInQueue={nextInQueue.remaining}
            onAccept={handleAccept}
            onOverride={handleOverride}
            onRerun={handleRerun}
            onExplain={handleExplain}
          />
          <OverrideModal
            open={overrideOpen}
            onOpenChange={setOverrideOpen}
            assessment={a}
          />
        </>
      )}
    </EligibilityShell>
  );
}
