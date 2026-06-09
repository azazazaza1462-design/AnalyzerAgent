import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Trash2, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/features/eligibility/components/AppHeader";
import { WorkspaceShell } from "./components/WorkspaceShell";
import { UploadDropzone } from "./components/UploadDropzone";
import { EmptyState } from "./components/EmptyState";
import { analyzerLabel, formatBytes, relativeTime } from "./labels";
import { ANALYZER_OPTIONS, TONE_ICON, uploadOption } from "./upload-config";
import { useUploadStore, type UploadItem, type UploadStatus } from "./stores/upload-store";
import type { AnalyzerType } from "./types";

export default function UploadPage() {
  const [analyzer, setAnalyzer] = useState<AnalyzerType>("credit_report");

  const items = useUploadStore((s) => s.items);
  const addFiles = useUploadStore((s) => s.addFiles);
  const uploadPending = useUploadStore((s) => s.uploadPending);
  const remove = useUploadStore((s) => s.remove);
  const clear = useUploadStore((s) => s.clear);

  const selected = uploadOption(analyzer);
  const pending = useMemo(
    () => items.filter((f) => f.status === "ready" || f.status === "error"),
    [items],
  );
  const doneCount = items.filter((f) => f.status === "done").length;
  const isUploading = items.some((f) => f.status === "uploading");

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-3xl">
        <AppHeader
          crumbs={[
            { label: "Viewnear" },
            { label: "Analyzers · LendLogic", href: "/" },
            { label: "Upload" },
          ]}
        />

        <header className="mb-8 space-y-2">
          <h1 className="text-[22px] font-medium tracking-tight text-ew-text-primary">
            Upload documents
          </h1>
          <p className="text-[14px] text-ew-text-secondary">
            Choose the analyzer this document feeds, then add the files to ingest.
          </p>
        </header>

        {/* Analyzer selector */}
        <section className="space-y-3">
          <SectionLabel>Document type</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-3">
            {ANALYZER_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = opt.analyzer === analyzer;
              return (
                <button
                  key={opt.analyzer}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setAnalyzer(opt.analyzer)}
                  className={cn(
                    "group relative flex flex-col gap-3 rounded-xl border-[0.5px] bg-ew-bg-primary p-4 text-left transition-colors",
                    active
                      ? "border-ew-text-primary ring-1 ring-ew-text-primary"
                      : "border-ew-border hover:border-ew-border-strong",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-md",
                        TONE_ICON[opt.tone],
                      )}
                    >
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    {active && (
                      <CheckCircle2 className="size-4 text-ew-text-primary" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="block text-[14px] font-medium text-ew-text-primary">
                      {analyzerLabel(opt.analyzer)}
                    </span>
                    <span className="block text-[12px] leading-snug text-ew-text-tertiary">
                      {opt.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Dropzone */}
        <section className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Add files</SectionLabel>
            <span className="text-[12px] text-ew-text-tertiary">
              {analyzerLabel(analyzer)} · {selected.accept.replace(/,/g, ", ")}
            </span>
          </div>
          <UploadDropzone
            accept={selected.accept}
            onFiles={(files) => addFiles(files, analyzer)}
          />
        </section>

        {/* Staged files + history */}
        <section className="mt-8 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <SectionLabel>Queue</SectionLabel>
              {items.length > 0 && (
                <span className="text-[12px] tabular-nums text-ew-text-tertiary">
                  {pending.length} pending
                  {doneCount > 0 && ` · ${doneCount} uploaded`}
                </span>
              )}
            </div>
            {items.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clear}
                  disabled={isUploading}
                  className="rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ew-text-secondary transition-colors hover:text-ew-text-primary disabled:opacity-50"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={uploadPending}
                  disabled={isUploading || pending.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-md bg-ew-text-primary px-3 py-1.5 text-[12px] font-medium text-ew-bg-primary transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {isUploading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="size-3.5" />
                  )}
                  {isUploading
                    ? "Uploading…"
                    : `Upload${pending.length > 0 ? ` ${pending.length}` : ""}`}
                </button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <EmptyState
              title="No files queued"
              description="Add documents above to stage them for the selected analyzer."
            />
          ) : (
            <ul className="space-y-2">
              {[...items].reverse().map((item) => (
                <li key={item.key}>
                  <StagedRow item={item} onRemove={() => remove(item.key)} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </WorkspaceShell>
  );
}

function StagedRow({ item, onRemove }: { item: UploadItem; onRemove: () => void }) {
  const Icon = uploadOption(item.analyzer).icon;
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-ew-bg-secondary text-ew-text-secondary">
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="truncate text-[14px] font-medium text-ew-text-primary">
              {item.name}
            </span>
            <span className="inline-flex shrink-0 items-center rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-ew-text-secondary">
              {analyzerLabel(item.analyzer)}
            </span>
          </div>
          <div className="text-[12px] text-ew-text-tertiary">
            {item.mime} · {formatBytes(item.size)}
            {item.uploadedAt && ` · ${relativeTime(item.uploadedAt)}`}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <StatusBadge status={item.status} />
        {item.status !== "uploading" && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.name}`}
            className="rounded-md p-1 text-ew-text-tertiary transition-colors hover:text-ew-text-primary"
          >
            {item.status === "done" ? <X className="size-4" /> : <Trash2 className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: UploadStatus }) {
  if (status === "uploading") {
    return <Loader2 className="size-4 animate-spin text-ew-text-tertiary" />;
  }
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border-[0.5px] border-ew-success-text/30 bg-ew-success-bg px-1.5 py-0.5 text-[11px] font-medium text-ew-success-text">
        <CheckCircle2 className="size-3" />
        Uploaded
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center rounded-md border-[0.5px] border-ew-danger-text/30 bg-ew-danger-bg px-1.5 py-0.5 text-[11px] font-medium text-ew-danger-text">
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border-[0.5px] border-ew-border bg-ew-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-ew-text-secondary">
      Ready
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
      {children}
    </span>
  );
}
