import { Link } from "react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { ModelGovernance } from "../types";

interface ModelHealthBannerProps {
  governance: ModelGovernance | undefined;
}

// Surfaces model-level health on top of an individual assessment so an
// underwriter doesn't trust a verdict produced by a degraded pipeline. We
// flag two conditions:
//  - pipelineStatus !== 'operational' (training/serving is impaired)
//  - drift PSI ≥ 0.2 (input distribution has shifted enough to investigate)
// Both link back to /underwriting/model/eligibility for full context.
const PSI_DRIFT_THRESHOLD = 0.2;

export function ModelHealthBanner({ governance }: ModelHealthBannerProps) {
  if (!governance) return null;

  const pipelineImpaired = governance.pipelineStatus !== "operational";
  const driftHigh = governance.driftPsi >= PSI_DRIFT_THRESHOLD;
  if (!pipelineImpaired && !driftHigh) return null;

  // Pipeline impairment is the harder failure (model may be stale or
  // unavailable); drift is a softer signal that the model is operating but
  // its inputs no longer match what it was trained on.
  const isDanger = governance.pipelineStatus === "down";
  const tone = isDanger
    ? "border-ew-danger-text/30 bg-ew-danger-bg/40 text-ew-danger-text"
    : "border-ew-warning-text/30 bg-ew-warning-bg/40 text-ew-warning-text";

  const headline = pipelineImpaired
    ? governance.pipelineStatus === "down"
      ? "Model pipeline is down"
      : "Model pipeline is degraded"
    : `Input drift above tolerance (PSI ${governance.driftPsi.toFixed(2)})`;

  const detail = pipelineImpaired
    ? "The verdict below may be based on a stale or partial model run. Treat with caution."
    : "Recent inputs differ from the training distribution. Review the model context before accepting findings.";

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-4 rounded-xl border-[0.5px] px-5 py-4 ${tone}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-0.5">
          <div className="text-[14px] font-medium">{headline}</div>
          <div className="text-[12px] text-ew-text-secondary">{detail}</div>
        </div>
      </div>
      <Link
        to="/underwriting/model/eligibility"
        className="inline-flex shrink-0 items-center gap-1 self-center text-[12px] font-medium underline-offset-2 hover:underline"
      >
        Open model governance
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
