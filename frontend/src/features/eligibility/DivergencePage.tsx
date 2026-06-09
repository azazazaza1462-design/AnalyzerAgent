import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  CircleHelp,
  Cpu,
  ListChecks,
  ScanLine,
  Split,
} from "lucide-react";
import { AppHeader } from "./components/AppHeader";
import { EligibilityShell } from "./components/EligibilityShell";
import { DimResultPill } from "./components/StatusPill";
import { OverrideModal } from "./components/OverrideModal";
import { Skeleton } from "./components/Skeleton";
import { useAssessment } from "./hooks/useAssessment";
import type { DimResult, ModelMode } from "./types";

export default function DivergencePage() {
  const { id, dim } = useParams<{ id: string; dim: string }>();
  const decoded = dim ? decodeURIComponent(dim) : "";
  const assessment = useAssessment(id);
  const navigate = useNavigate();
  const [overrideOpen, setOverrideOpen] = useState(false);

  const a = assessment.data;
  const divergence = a?.parity.divergences.find((d) => d.dimension === decoded);

  // The action set depends on the model's role in the workflow. We implement
  // parallel_signal fully; the others render but route to no-ops.
  const actions = a ? actionsForMode(a.mode) : [];

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
          { label: "Divergence" },
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
          <Skeleton className="h-16" />
          <Skeleton className="h-72" />
        </div>
      ) : !divergence || !a ? (
        <div className="rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary px-5 py-10 text-center text-[14px] text-ew-text-tertiary">
          No divergence recorded for "{decoded}".
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center gap-3 rounded-xl border-[0.5px] border-ew-warning-text/30 bg-ew-warning-bg/40 px-5 py-4">
            <Split className="size-4 shrink-0 text-ew-warning-text" />
            <div className="space-y-0.5">
              <div className="text-[14px] font-medium text-ew-warning-text">
                The two engines disagree on {divergence.dimension.toLowerCase()}
              </div>
              <div className="text-[12px] text-ew-text-secondary">
                Reconcile by accepting the model view, deferring to the rules
                engine, or escalating to policy.
              </div>
            </div>
          </div>

          <section>
            <h2 className="mb-4 text-[18px] font-medium text-ew-text-primary">
              Engine comparison
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <EngineCard
                title="AI eligibility analyzer"
                subtitle={`Custom model ${a.modelVersion}`}
                icon={<Cpu className="size-4" strokeWidth={1.75} />}
                method={divergence.ai.method}
                input={divergence.ai.input}
                result={divergence.ai.result}
                status={divergence.ai.status}
                highlighted
              />
              <EngineCard
                title="Rules engine"
                subtitle="Deterministic policy"
                icon={<ListChecks className="size-4" strokeWidth={1.75} />}
                method={divergence.rules.method}
                input={divergence.rules.input}
                result={divergence.rules.result}
                status={divergence.rules.status}
              />
            </div>
          </section>

          <section className="rounded-xl border-[0.5px] border-ew-info-text/30 bg-ew-info-bg/30 p-5">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-ew-info-text">
              <CircleHelp className="size-3.5" />
              <span>Why they differ</span>
            </div>
            <p className="max-w-prose text-[14px] leading-relaxed text-ew-text-primary">
              {divergence.explanation}
            </p>
          </section>

          <section className="flex flex-wrap items-center gap-2 border-t-[0.5px] border-ew-border pt-6">
            {actions.includes("accept_model") && (
              <button
                type="button"
                onClick={() => setOverrideOpen(true)}
                className="inline-flex items-center rounded-md bg-ew-text-primary px-3 py-1.5 text-[14px] font-medium text-ew-bg-primary transition-opacity hover:opacity-90"
              >
                Accept model view
              </button>
            )}
            {actions.includes("defer_rules") && (
              <button
                type="button"
                onClick={() =>
                  toast.info("Deferred to rules engine", {
                    description: "Mock action — would re-route through the rules verdict.",
                  })
                }
                className="inline-flex items-center rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary px-3 py-1.5 text-[14px] font-medium text-ew-text-primary transition-colors hover:border-ew-border-strong"
              >
                Defer to rules engine
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                navigate(`/underwriting/app/${id}/eligibility`)
              }
              className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[14px] font-medium text-ew-text-secondary transition-colors hover:text-ew-text-primary"
            >
              <ScanLine className="size-3.5" />
              View provenance
            </button>
          </section>
        </div>
      )}

      {a && (
        <OverrideModal
          open={overrideOpen}
          onOpenChange={setOverrideOpen}
          assessment={a}
          dimension={decoded}
        />
      )}
    </EligibilityShell>
  );
}

function EngineCard({
  title,
  subtitle,
  icon,
  method,
  input,
  result,
  status,
  highlighted = false,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  method: string;
  input: string;
  result: string;
  status: DimResult;
  highlighted?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "rounded-xl border-2 border-ew-info-text bg-ew-bg-primary p-5"
          : "rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-5"
      }
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="text-ew-text-secondary">{icon}</div>
        <div className="space-y-0.5">
          <h3 className="text-[16px] font-medium text-ew-text-primary">{title}</h3>
          <p className="text-[12px] text-ew-text-tertiary">{subtitle}</p>
        </div>
      </div>
      <dl className="space-y-3 text-[14px]">
        <Row label="Method" value={method} />
        <Row label="Input" value={input} />
        <Row
          label="Result"
          value={
            <span className="inline-flex items-center gap-2">
              <span className="font-medium text-ew-text-primary">{result}</span>
              <DimResultPill result={status} />
            </span>
          }
        />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[100px_1fr]">
      <dt className="text-[12px] font-medium uppercase tracking-wide text-ew-text-tertiary">
        {label}
      </dt>
      <dd className="text-ew-text-primary">{value}</dd>
    </div>
  );
}

function actionsForMode(mode: ModelMode): string[] {
  // parallel_signal is the default we ship. The other modes are scaffolded so
  // adding them later only touches this map.
  switch (mode) {
    case "parallel_signal":
      return ["accept_model", "defer_rules"];
    case "fallback":
      return ["defer_rules"];
    case "validation_layer":
      return ["accept_model"];
  }
}
