import { Cpu } from "lucide-react";
import { ConfidenceBar } from "./ConfidenceBar";
import { ModeBadge } from "./ModeBadge";
import { StatusPill, VerdictPill } from "./StatusPill";
import { relativeTimeShort } from "../utils";
import type { EligibilityAssessment } from "../types";

export function VerdictCard({ assessment }: { assessment: EligibilityAssessment }) {
  const { verdict, confidence, modelVersion, mode, runAt } = assessment;

  return (
    <div className="rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-ew-text-tertiary">Verdict</span>
            <VerdictPill verdict={verdict} size="md" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="info">
              <Cpu className="mr-1 size-3" />
              Custom model {modelVersion}
            </StatusPill>
            <ModeBadge mode={mode} />
            <span className="text-[12px] text-ew-text-tertiary">
              Run {relativeTimeShort(runAt)}
            </span>
          </div>
        </div>

        <div className="w-full max-w-[280px]">
          <ConfidenceBar value={confidence} verdict={verdict} size="lg" />
        </div>
      </div>
    </div>
  );
}
