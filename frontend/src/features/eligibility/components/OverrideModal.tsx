import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { REASON_CODES } from "../data/mock";
import { runHashFor } from "../utils";
import { useOverride, useRecordOverride } from "../hooks/useAssessment";
import type { EligibilityAssessment, Verdict } from "../types";

interface OverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: EligibilityAssessment;
  dimension?: string;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  eligible: "Eligible",
  conditional: "Conditional",
  ineligible: "Ineligible",
  pending: "Pending",
};

export function OverrideModal({
  open,
  onOpenChange,
  assessment,
  dimension,
}: OverrideModalProps) {
  const applicationId = assessment.application.id;
  const overrideQuery = useOverride(applicationId);
  const recordMutation = useRecordOverride(applicationId);
  const user = useAuthStore((s) => s.user);

  const existing = overrideQuery.data;
  const [decision, setDecision] = useState<"accept" | "override">("accept");
  const [reasonCode, setReasonCode] = useState<string>(REASON_CODES[0].code);
  const [rationale, setRationale] = useState<string>("");

  // Reset form state when opening fresh.
  useEffect(() => {
    if (open) {
      setDecision("accept");
      setReasonCode(REASON_CODES[0].code);
      setRationale("");
    }
  }, [open]);

  const submit = () => {
    if (rationale.trim().length === 0) {
      toast.error("Add an audit note before recording.");
      return;
    }
    recordMutation.mutate(
      {
        applicationId,
        dimension,
        decision,
        resolution: decision === "override" ? "approve_as_eligible" : undefined,
        reasonCode,
        rationale: rationale.trim(),
        recordedBy: user?.email ?? "unknown",
        recordedAt: new Date().toISOString(),
        modelRunHash: runHashFor(applicationId, assessment.runAt),
      },
      {
        onSuccess: () => {
          toast.success(
            decision === "override"
              ? "Override recorded"
              : "Acceptance recorded",
          );
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error("Failed to record decision", {
            description: (err as Error).message,
          }),
      },
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ew-text-primary/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-6 text-ew-text-primary shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Dialog.Title className="text-[18px] font-medium">
                {existing ? "Decision recorded" : "Override AI finding"}
              </Dialog.Title>
              <Dialog.Description className="text-[12px] text-ew-text-secondary">
                {applicationId} ·{" "}
                {dimension ? `${dimension} · ` : ""}
                Model verdict: {VERDICT_LABEL[assessment.verdict]}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-1 text-ew-text-tertiary transition-colors hover:bg-ew-bg-secondary hover:text-ew-text-primary"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          {existing ? (
            <DecisionRecord
              recordedBy={existing.recordedBy}
              recordedAt={existing.recordedAt}
              decision={existing.decision}
              dimension={existing.dimension}
              reasonCode={existing.reasonCode}
              rationale={existing.rationale}
              modelRunHash={existing.modelRunHash}
            />
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <RadioOption
                  label="Accept model finding"
                  description="Concur with the model's verdict and move forward."
                  checked={decision === "accept"}
                  onChange={() => setDecision("accept")}
                />
                <RadioOption
                  label="Override — approve as eligible"
                  description="Disagree with the model. Approve the borrower with documented reasoning."
                  checked={decision === "override"}
                  onChange={() => setDecision("override")}
                  highlight
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-ew-text-secondary">
                  Reason code
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="h-9 w-full rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary px-3 text-[14px] text-ew-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ew-info-text/40"
                >
                  {REASON_CODES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-ew-text-secondary">
                  Rationale (audit note)
                </label>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  rows={4}
                  placeholder="Explain why you're recording this decision. This goes into the audit log."
                  className="w-full resize-none rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary px-3 py-2 text-[14px] text-ew-text-primary placeholder:text-ew-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ew-info-text/40"
                />
              </div>

              <div className="flex items-start gap-2 rounded-md bg-ew-bg-secondary/60 p-3 text-[12px] text-ew-text-secondary">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-ew-text-tertiary" />
                <span>
                  Logged with your ID, timestamp and the model run hash. Decision is
                  immutable once recorded.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-md px-3 py-1.5 text-[14px] font-medium text-ew-text-secondary transition-colors hover:text-ew-text-primary"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={submit}
                  disabled={recordMutation.isPending}
                  className="inline-flex items-center rounded-md bg-ew-text-primary px-3 py-1.5 text-[14px] font-medium text-ew-bg-primary transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {recordMutation.isPending
                    ? "Recording…"
                    : decision === "override"
                      ? "Record override"
                      : "Record acceptance"}
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RadioOption({
  label,
  description,
  checked,
  onChange,
  highlight = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  highlight?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md px-3 py-3 transition-colors",
        highlight && checked
          ? "border-2 border-ew-info-text bg-ew-info-bg/30"
          : "border-[0.5px] border-ew-border hover:border-ew-border-strong",
      )}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-1 size-4 accent-ew-info-text"
      />
      <div className="min-w-0 space-y-0.5">
        <div className="text-[14px] font-medium text-ew-text-primary">{label}</div>
        <div className="text-[12px] text-ew-text-secondary">{description}</div>
      </div>
    </label>
  );
}

function DecisionRecord({
  recordedBy,
  recordedAt,
  decision,
  dimension,
  reasonCode,
  rationale,
  modelRunHash,
}: {
  recordedBy: string;
  recordedAt: string;
  decision: "accept" | "override";
  dimension?: string;
  reasonCode: string;
  rationale: string;
  modelRunHash: string;
}) {
  const reasonLabel =
    REASON_CODES.find((r) => r.code === reasonCode)?.label ?? reasonCode;
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 rounded-md bg-ew-success-bg px-2.5 py-1 text-[12px] font-medium text-ew-success-text">
        <Check className="size-3.5" />
        {decision === "override" ? "Override recorded" : "Acceptance recorded"}
      </div>
      <dl className="space-y-3 text-[14px]">
        <RecordRow label="Scope" value={dimension ?? "Application-level"} />
        <RecordRow label="Recorded by" value={recordedBy} />
        <RecordRow label="Recorded at" value={new Date(recordedAt).toLocaleString()} />
        <RecordRow label="Reason code" value={reasonLabel} />
        <RecordRow label="Rationale" value={rationale} multiline />
        <RecordRow label="Model run hash" value={<code className="font-mono text-[12px]">{modelRunHash}</code>} />
      </dl>
    </div>
  );
}

function RecordRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-1 sm:grid-cols-[120px_1fr]",
        multiline ? "items-start" : "items-baseline",
      )}
    >
      <dt className="text-[12px] font-medium uppercase tracking-wide text-ew-text-tertiary">
        {label}
      </dt>
      <dd className="text-ew-text-primary">{value}</dd>
    </div>
  );
}
