import { Link } from "react-router";
import { ArrowRight, Check, Cpu, ListChecks, Split } from "lucide-react";
import { ParityColumn } from "./ParityColumn";
import type { EligibilityAssessment } from "../types";

interface ParityPanelProps {
  assessment: EligibilityAssessment;
  applicationId: string;
}

export function ParityPanel({ assessment, applicationId }: ParityPanelProps) {
  const { parity } = assessment;
  const isAgreement = parity.status === "agreement";
  const isDivergence = parity.status === "divergence";
  // Build a set of dimension names that have divergence detail records, so we
  // can mark the corresponding rows and link out from the right column.
  const divergentNames = new Set(parity.divergences.map((d) => d.dimension));

  const aiDims = parity.dimensions.map((d) => ({
    name: d.name,
    result: d.ai,
    divergent: divergentNames.has(d.name),
  }));
  const rulesDims = parity.dimensions.map((d) => ({
    name: d.name,
    result: d.rules,
    divergent: divergentNames.has(d.name),
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[18px] font-medium text-ew-text-primary">Parity with rules engine</h2>
          <p className="text-[14px] text-ew-text-secondary">
            Side-by-side dimensions evaluated by both engines.
          </p>
        </div>
      </div>

      <ParityBanner status={parity.status} divergentCount={parity.divergences.length} />

      {parity.dimensions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <ParityColumn
            title="AI eligibility analyzer"
            subtitle="Custom model"
            icon={<Cpu className="size-4" strokeWidth={1.75} />}
            dimensions={aiDims}
            highlighted={isDivergence}
          />
          <ParityColumn
            title="Rules engine"
            subtitle="Deterministic policy"
            icon={<ListChecks className="size-4" strokeWidth={1.75} />}
            dimensions={rulesDims}
          />
        </div>
      )}

      {isDivergence && parity.divergences.length > 0 && (
        <div className="rounded-xl border-[0.5px] border-ew-warning-text/30 bg-ew-warning-bg/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-ew-warning-text">
            <Split className="size-3.5" />
            <span>Divergent dimensions</span>
          </div>
          <ul className="space-y-2">
            {parity.divergences.map((d) => (
              <li key={d.dimension}>
                <Link
                  to={`/underwriting/app/${applicationId}/divergence/${encodeURIComponent(d.dimension)}`}
                  className="flex items-center justify-between gap-3 rounded-md bg-ew-bg-primary px-3 py-2 text-[14px] text-ew-text-primary transition-colors hover:bg-ew-bg-secondary"
                >
                  <span className="font-medium">{d.dimension}</span>
                  <span className="inline-flex items-center gap-1 text-[12px] text-ew-text-secondary">
                    Compare engines
                    <ArrowRight className="size-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isAgreement && (
        <p className="text-[12px] text-ew-text-tertiary">
          <Check className="mr-1 inline size-3.5 align-text-bottom text-ew-success-text" />
          Both engines agree on all evaluated dimensions.
        </p>
      )}
    </section>
  );
}

function ParityBanner({
  status,
  divergentCount,
}: {
  status: "agreement" | "divergence" | "pending";
  divergentCount: number;
}) {
  if (status === "agreement") {
    return (
      <div className="flex items-center gap-3 rounded-xl border-[0.5px] border-ew-success-text/30 bg-ew-success-bg/40 px-4 py-3 text-[14px] text-ew-success-text">
        <Check className="size-4 shrink-0" />
        <span className="font-medium">Full agreement</span>
        <span className="text-ew-text-secondary">
          AI analyzer and rules engine concur on all dimensions.
        </span>
      </div>
    );
  }
  if (status === "divergence") {
    return (
      <div className="flex items-center gap-3 rounded-xl border-[0.5px] border-ew-warning-text/30 bg-ew-warning-bg/40 px-4 py-3 text-[14px] text-ew-warning-text">
        <Split className="size-4 shrink-0" />
        <span className="font-medium">
          {divergentCount === 1
            ? "1 dimension disagrees"
            : `${divergentCount} dimensions disagree`}
        </span>
        <span className="text-ew-text-secondary">
          Underwriter arbitration required.
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border-[0.5px] border-ew-border bg-ew-bg-secondary/40 px-4 py-3 text-[14px] text-ew-text-secondary">
      <span>Parity comparison pending — model run in progress.</span>
    </div>
  );
}
