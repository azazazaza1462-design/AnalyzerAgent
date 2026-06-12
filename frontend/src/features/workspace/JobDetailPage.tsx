import { Link, useParams } from "react-router";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { AppHeader } from "@/features/eligibility/components/AppHeader";
import { WorkspaceShell } from "./components/WorkspaceShell";
import { StatusDot } from "./components/StatusDot";
import { useJobRun } from "./hooks/useJobs";
import { analyzerLabel, relativeTime, statusLabel } from "./labels";
import { IdValidationResultView } from "./components/IdValidationResult";
import type { AnalyzerCall } from "./types";

export default function JobDetailPage() {
  const { id } = useParams();
  const { data: run, isLoading, isError } = useJobRun(id);

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-3xl">
        <AppHeader
          crumbs={[
            { label: "Viewnear" },
            { label: "Analyzers · LendLogic", href: "/" },
            { label: "Reports", href: "/reports" },
            { label: id ?? "Job" },
          ]}
        />

        <Link
          to="/reports"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ew-text-secondary transition-colors hover:text-ew-text-primary"
        >
          <ArrowLeft className="size-3.5" /> Back to reports
        </Link>

        {isLoading && <p className="text-[14px] text-ew-text-tertiary">Loading run…</p>}
        {isError && <p className="text-[14px] text-ew-danger-text">Could not load this job.</p>}

        {run && (
          <div className="space-y-8">
            {/* Header */}
            <header className="space-y-2">
              <div className="flex items-center gap-2.5">
                <h1 className="text-[22px] font-medium tracking-tight text-ew-text-primary">
                  {analyzerLabel(run.analyzer)} analyzer
                </h1>
                <StatusDot status={run.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[12px] text-ew-text-tertiary">
                <span>{run.id}</span>
                {run.applicationId && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{run.applicationId}</span>
                  </>
                )}
                <span aria-hidden>·</span>
                <span>{statusLabel(run.status)}</span>
                <span aria-hidden>·</span>
                <span>created {relativeTime(run.createdAt)}</span>
              </div>
            </header>

            {/* Analyzing banner — visible while the agent runs the pipeline */}
            {(run.status === "pending" || run.status === "in_progress") && (
              <div className="flex items-center gap-2.5 rounded-lg border-[0.5px] border-ew-border bg-ew-bg-secondary px-3.5 py-3 text-[13px] text-ew-text-secondary">
                <Loader2 className="size-4 animate-spin text-ew-text-primary" />
                <span>
                  {run.status === "pending"
                    ? "Queued — waiting for the analyzer agent to pick this up…"
                    : "Analyzing the document with Claude vision…"}
                </span>
                <span className="text-ew-text-tertiary">· updates automatically</span>
              </div>
            )}

            {/* Request */}
            <Section title="Request">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[13px]">
                <Field label="Document type" value={run.request.documentType} />
                <Field label="Application" value={run.request.applicationId ?? "—"} />
                <Field label="Attachments" value={`${run.documentIds.length}`} />
                <Field label="LOS name" value={run.request.losData?.fullName ?? "—"} />
                <Field label="LOS DOB" value={run.request.losData?.dateOfBirth ?? "—"} />
              </dl>
            </Section>

            {/* Status timeline */}
            <Section title="Status timeline">
              <ol className="space-y-2">
                {run.statusHistory.map((ev, i) => (
                  <li key={i} className="flex items-center gap-3 text-[13px]">
                    <StatusDot status={ev.status} />
                    <span className="text-ew-text-primary">{statusLabel(ev.status)}</span>
                    <span className="text-ew-text-tertiary">{relativeTime(ev.at)}</span>
                    {ev.note && <span className="text-ew-text-tertiary">· {ev.note}</span>}
                  </li>
                ))}
              </ol>
            </Section>

            {/* Calls */}
            <Section title={`Steps (${run.calls.length})`}>
              <ul className="space-y-2">
                {run.calls.map((call, i) => (
                  <CallRow key={i} call={call} />
                ))}
                {run.calls.length === 0 && (
                  <li className="text-[13px] text-ew-text-tertiary">No steps recorded.</li>
                )}
              </ul>
            </Section>

            {/* Result */}
            {run.response && (
              <Section title="Result">
                <IdValidationResultView result={run.response} />
              </Section>
            )}

            {/* Errors */}
            {run.errors.length > 0 && (
              <Section title="Errors">
                <ul className="space-y-2">
                  {run.errors.map((e, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-md bg-ew-danger-bg/40 px-3 py-2 text-[13px] text-ew-danger-text"
                    >
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}

function CallRow({ call }: { call: AnalyzerCall }) {
  const seconds = (call.durationMs / 1000).toFixed(call.durationMs >= 1000 ? 1 : 2);
  return (
    <li
      className={`rounded-lg border-[0.5px] px-3 py-2.5 ${
        call.success ? "border-ew-border bg-ew-bg-primary" : "border-ew-danger-text/30 bg-ew-danger-bg/30"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-ew-text-primary">{call.label}</span>
        <span className="shrink-0 font-mono text-[11px] text-ew-text-tertiary">{seconds}s</span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-ew-text-tertiary">
        <span>{call.step}</span>
        <span aria-hidden>·</span>
        <span>{call.model ?? "deterministic"}</span>
        {(call.inputTokens > 0 || call.outputTokens > 0) && (
          <>
            <span aria-hidden>·</span>
            <span>in {call.inputTokens} / out {call.outputTokens} tok</span>
          </>
        )}
      </div>
      {call.error && <div className="mt-1 text-[12px] text-ew-danger-text">{call.error}</div>}
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-ew-text-tertiary">{label}</dt>
      <dd className="text-ew-text-primary">{value}</dd>
    </>
  );
}

