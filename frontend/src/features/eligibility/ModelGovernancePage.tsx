import { Check, Cpu, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { AppHeader } from "./components/AppHeader";
import { EligibilityShell } from "./components/EligibilityShell";
import { MetricCard } from "./components/MetricCard";
import { Skeleton } from "./components/Skeleton";
import { StatusPill } from "./components/StatusPill";
import { useModelGovernance } from "./hooks/useAssessment";
import { formatDate, pipelineLabel, pipelineTone } from "./utils";
import type { ModelGovernance } from "./types";

export default function ModelGovernancePage() {
  const governance = useModelGovernance();
  const g = governance.data;

  return (
    <EligibilityShell>
      <AppHeader
        crumbs={[
          { label: "Viewnear" },
          { label: "Underwriting workbench", href: "/underwriting/queue" },
          { label: "Model governance" },
          { label: "Eligibility model" },
        ]}
      />

      {governance.isLoading || !g ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-72" />
          <div className="grid gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="space-y-12">
          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[22px] font-medium tracking-tight text-ew-text-primary">
                Eligibility model · {g.version}
              </h1>
              {g.inProduction && (
                <StatusPill tone="success">
                  <Check className="mr-1 size-3" />
                  In production
                </StatusPill>
              )}
            </div>
            <p className="text-[14px] text-ew-text-secondary">
              Custom AI model that complements the deterministic rules engine.
              Tracked metrics below summarise pipeline health, parity with rules,
              and fairness audit results.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-[18px] font-medium text-ew-text-primary">Health</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard
                label="Training pipeline"
                icon={<Cpu className="size-3.5" strokeWidth={1.75} />}
                value={pipelineLabel(g.pipelineStatus)}
                meta="All scheduled jobs succeeded"
                tone={pipelineTone(g.pipelineStatus)}
              />
              <MetricCard
                label="Last retrain"
                icon={<TrendingUp className="size-3.5" strokeWidth={1.75} />}
                value={`${g.lastRetrainDays}d ago`}
                meta="Cadence: 30d"
              />
              <MetricCard
                label="Parity with rules"
                icon={<Scale className="size-3.5" strokeWidth={1.75} />}
                value={`${Math.round(g.parityRate * 100)}%`}
                meta="Agreement on evaluated dimensions"
                tone={g.parityRate >= 0.9 ? "success" : "warning"}
              />
              <MetricCard
                label="Drift (PSI)"
                icon={
                  g.driftPsi < 0.1 ? (
                    <TrendingDown className="size-3.5" strokeWidth={1.75} />
                  ) : (
                    <TrendingUp className="size-3.5" strokeWidth={1.75} />
                  )
                }
                value={g.driftPsi.toFixed(2)}
                meta={g.driftPsi < 0.1 ? "Within tolerance" : "Investigate"}
                tone={g.driftPsi < 0.1 ? "success" : "warning"}
              />
            </div>
          </section>

          <FairnessSection g={g} />
        </div>
      )}
    </EligibilityShell>
  );
}

function FairnessSection({ g }: { g: ModelGovernance }) {
  const rates = g.fairness.groups.map((x) => x.approvalRate);
  const max = Math.max(...rates);
  const min = Math.min(...rates);
  const disparityPts = Math.round((max - min) * 100);
  const withinTolerance = disparityPts <= g.fairness.tolerancePts;

  // Scale bars relative to the largest rate so the small differences read
  // clearly without exaggerating absolute approval levels.
  const barMax = Math.max(max, 1);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[18px] font-medium text-ew-text-primary">
            Fairness controls
          </h2>
          <p className="text-[14px] text-ew-text-secondary">
            Approval-rate parity across protected groups. Tolerance: ±
            {g.fairness.tolerancePts}pt. Group labels are placeholders pending
            fair-lending policy sign-off.
          </p>
        </div>
        <StatusPill tone={withinTolerance ? "success" : "warning"}>
          Max disparity {disparityPts}pt
        </StatusPill>
      </div>

      <div className="rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-5">
        <ul className="space-y-4">
          {g.fairness.groups.map((grp) => {
            const pct = Math.round(grp.approvalRate * 100);
            const barPct = (grp.approvalRate / barMax) * 100;
            return (
              <li key={grp.group} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-[14px]">
                  <span className="text-ew-text-primary">{grp.group}</span>
                  <span className="tabular-nums text-ew-text-secondary">{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-ew-bg-secondary">
                  <div
                    className="h-full rounded-full bg-ew-info-text/70"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 border-t-[0.5px] border-ew-border pt-4 text-[12px] text-ew-text-tertiary">
          Last audit: {formatDate(g.fairness.lastAuditAt)}
        </div>
      </div>
    </section>
  );
}

