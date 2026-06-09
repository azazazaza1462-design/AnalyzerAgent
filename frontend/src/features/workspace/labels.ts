import type { AnalyzerType, JobStatus } from "./types";

// Friendly labels for the union types. Acronyms (ID) stay uppercase even
// under sentence-case rules — that's how they read in product copy.
const ANALYZER_LABEL: Record<AnalyzerType, string> = {
  credit_report: "Credit report",
  bank_statement: "Bank statement",
  id_validation: "ID validation",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  pending: "Pending",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function analyzerLabel(t: AnalyzerType): string {
  return ANALYZER_LABEL[t];
}

export function statusLabel(s: JobStatus): string {
  return STATUS_LABEL[s];
}

export function relativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const diffSec = (Date.parse(iso) - Date.now()) / 1000;
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [unit, secs] of units) {
    if (abs >= secs || unit === "second") {
      return rtf.format(Math.round(diffSec / secs), unit);
    }
  }
  return rtf.format(0, "second");
}

// Compact duration formatter for job rows. Returns "1h 12m", "5m", "30s".
// If `end` is omitted the duration is open-ended (still running); the caller
// is responsible for choosing the right framing label ("ran" vs "running").
export function formatDuration(startIso: string, endIso?: string): string {
  const start = Date.parse(startIso);
  const end = endIso ? Date.parse(endIso) : Date.now();
  const ms = Math.max(0, end - start);
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const totalMin = Math.floor(totalSec / 60);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Coarse buckets used to group lists in a Linear/Stripe-style feed. Anything
// older than "Earlier this week" lands in the last bucket — fine for a tool
// that surfaces recent activity, not deep history.
export type DateBucket = "Today" | "Yesterday" | "Earlier this week" | "Earlier";

export function dateBucket(iso: string, now = Date.now()): DateBucket {
  const ms = Date.parse(iso);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const startOfWeek = startOfToday - 6 * 86_400_000;
  if (ms >= startOfToday) return "Today";
  if (ms >= startOfYesterday) return "Yesterday";
  if (ms >= startOfWeek) return "Earlier this week";
  return "Earlier";
}
