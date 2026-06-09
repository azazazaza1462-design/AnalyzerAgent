// Small formatters shared across eligibility screens. Kept close to the
// feature so they don't leak into the global utils file.

export function relativeTimeShort(iso?: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - Date.parse(iso);
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export function formatAmount(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Stable, fake "model run hash" derived from the application id + run time.
// In a real backend this would come from the inference pipeline.
export function runHashFor(applicationId: string, runAt: string): string {
  const seed = `${applicationId}-${runAt}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `mr_${h.toString(16).padStart(8, "0")}`;
}

type PipelineStatus = "operational" | "degraded" | "down" | undefined;

export function pipelineLabel(status: PipelineStatus): string {
  if (!status) return "—";
  return status === "operational"
    ? "Operational"
    : status === "degraded"
      ? "Degraded"
      : "Down";
}

export function pipelineTone(
  status: PipelineStatus,
): "neutral" | "success" | "warning" | "danger" {
  if (!status) return "neutral";
  return status === "operational"
    ? "success"
    : status === "degraded"
      ? "warning"
      : "danger";
}
