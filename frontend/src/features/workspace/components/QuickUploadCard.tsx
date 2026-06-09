import { useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANALYZER_OPTIONS, TONE_ICON, uploadOption } from "../upload-config";
import { analyzerLabel, formatBytes, relativeTime } from "../labels";
import { useUploadStore, type UploadItem } from "../stores/upload-store";
import type { AnalyzerType } from "../types";
import { UploadDropzone } from "./UploadDropzone";

const RECENT_LIMIT = 4;

// Compact upload entry point for the dashboard. Drops upload in place (no
// navigation) against the shared upload store, so progress and history are
// visible right here. The full /upload page reads the same store.
export function QuickUploadCard() {
  const [analyzer, setAnalyzer] = useState<AnalyzerType>("credit_report");
  const selected = ANALYZER_OPTIONS.find((o) => o.analyzer === analyzer)!;

  const items = useUploadStore((s) => s.items);
  const addAndUpload = useUploadStore((s) => s.addAndUpload);
  const clearCompleted = useUploadStore((s) => s.clearCompleted);

  // Most recent first; active uploads naturally sort to the top.
  const recent = [...items].reverse();
  const visible = recent.slice(0, RECENT_LIMIT);
  const overflow = recent.length - visible.length;
  const hasCompleted = items.some((i) => i.status === "done");

  return (
    <section aria-labelledby="quick-upload-heading">
      <div className="space-y-4 rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary p-4">
        <h2
          id="quick-upload-heading"
          className="text-[14px] font-medium tracking-tight text-ew-text-primary"
        >
          Quick upload
        </h2>

        {/* Document type picker */}
        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Document type">
          {ANALYZER_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = opt.analyzer === analyzer;
            return (
              <button
                key={opt.analyzer}
                type="button"
                role="tab"
                aria-selected={active}
                title={opt.description}
                onClick={() => setAnalyzer(opt.analyzer)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border-[0.5px] px-2 py-2.5 text-center transition-colors",
                  active
                    ? "border-ew-text-primary ring-1 ring-ew-text-primary"
                    : "border-ew-border hover:border-ew-border-strong",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md",
                    TONE_ICON[opt.tone],
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} />
                </span>
                <span className="text-[11px] font-medium leading-tight text-ew-text-secondary">
                  {analyzerLabel(opt.analyzer)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Compact dropzone — uploads in place against the shared store */}
        <UploadDropzone
          accept={selected.accept}
          compact
          onFiles={(files) => addAndUpload(files, analyzer)}
        />

        {/* Process + history, inline */}
        {items.length > 0 && (
          <div className="space-y-2 border-t-[0.5px] border-ew-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-ew-text-tertiary">
                Recent uploads
              </span>
              {hasCompleted && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="text-[11px] font-medium text-ew-text-secondary transition-colors hover:text-ew-text-primary"
                >
                  Clear
                </button>
              )}
            </div>
            <ul className="space-y-1">
              {visible.map((item) => (
                <li key={item.key}>
                  <CompactRow item={item} />
                </li>
              ))}
            </ul>
            {overflow > 0 && (
              <p className="text-[11px] text-ew-text-tertiary">+{overflow} more</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function CompactRow({ item }: { item: UploadItem }) {
  const Icon = uploadOption(item.analyzer).icon;
  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ew-bg-secondary text-ew-text-secondary">
        <Icon className="size-3.5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-ew-text-primary">{item.name}</div>
        <div className="text-[11px] text-ew-text-tertiary">
          {analyzerLabel(item.analyzer)} · {formatBytes(item.size)}
          {item.uploadedAt && ` · ${relativeTime(item.uploadedAt)}`}
        </div>
      </div>
      <StatusIcon item={item} />
    </div>
  );
}

function StatusIcon({ item }: { item: UploadItem }) {
  if (item.status === "uploading") {
    return <Loader2 className="size-3.5 shrink-0 animate-spin text-ew-text-tertiary" />;
  }
  if (item.status === "done") {
    return <CheckCircle2 className="size-3.5 shrink-0 text-ew-success-text" />;
  }
  if (item.status === "error") {
    return <X className="size-3.5 shrink-0 text-ew-danger-text" />;
  }
  return (
    <span className="shrink-0 text-[11px] font-medium text-ew-text-tertiary">Ready</span>
  );
}
