import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { AppHeader } from "./components/AppHeader";
import { EligibilityShell } from "./components/EligibilityShell";
import { VerdictPill } from "./components/StatusPill";
import { ParityIcon } from "./components/ParityIcon";
import { QueueRowSkeleton } from "./components/Skeleton";
import { useQueue } from "./hooks/useQueue";
import type { EligibilityAssessment } from "./types";

type FilterKey = "all" | "divergences" | "conditional" | "pending";

function formatAmount(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function matchesFilter(item: EligibilityAssessment, filter: FilterKey): boolean {
  switch (filter) {
    case "divergences":
      return item.parity.status === "divergence";
    case "conditional":
      return item.verdict === "conditional";
    case "pending":
      return item.verdict === "pending";
    default:
      return true;
  }
}

export default function QueuePage() {
  const query = useQueue();
  const [filter, setFilter] = useState<FilterKey>("all");

  const items = query.data ?? [];

  const counts = useMemo(() => {
    return {
      all: items.length,
      divergences: items.filter((i) => i.parity.status === "divergence").length,
      conditional: items.filter((i) => i.verdict === "conditional").length,
      pending: items.filter((i) => i.verdict === "pending").length,
    };
  }, [items]);

  const visible = items.filter((i) => matchesFilter(i, filter));

  return (
    <EligibilityShell>
      <AppHeader
        crumbs={[
          { label: "Viewnear" },
          { label: "Underwriting workbench", href: "/underwriting/queue" },
          { label: "Eligibility queue" },
        ]}
      />

      <header className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[22px] font-medium tracking-tight text-ew-text-primary">
            Eligibility queue
          </h1>
          <p className="text-[14px] text-ew-text-secondary">
            {counts.all} {counts.all === 1 ? "application" : "applications"} awaiting underwriter review
          </p>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Filter queue"
        className="mb-6 flex flex-wrap items-center gap-2"
      >
        <FilterChip
          label="All"
          count={counts.all}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterChip
          label="Divergences"
          count={counts.divergences}
          active={filter === "divergences"}
          onClick={() => setFilter("divergences")}
          tone="warning"
        />
        <FilterChip
          label="Conditional"
          count={counts.conditional}
          active={filter === "conditional"}
          onClick={() => setFilter("conditional")}
        />
        <FilterChip
          label="Pending"
          count={counts.pending}
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
        />
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <QueueRowSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border-[0.5px] border-ew-border bg-ew-bg-primary px-5 py-12 text-center text-[14px] text-ew-text-tertiary">
          No applications match this filter.
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => (
            <li key={item.application.id}>
              <QueueRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </EligibilityShell>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  tone = "neutral",
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  tone?: "neutral" | "warning";
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border-[0.5px] px-2.5 py-1 text-[12px] font-medium transition-colors",
        active
          ? "border-ew-text-primary bg-ew-text-primary text-ew-bg-primary"
          : "border-ew-border bg-ew-bg-secondary text-ew-text-secondary hover:border-ew-border-strong hover:text-ew-text-primary",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          active
            ? "text-ew-bg-primary/70"
            : tone === "warning" && count > 0
              ? "text-ew-warning-text"
              : "text-ew-text-tertiary",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function QueueRow({ item }: { item: EligibilityAssessment }) {
  const { application, verdict, confidence, parity } = item;
  const isAnalyzing = verdict === "pending";
  const isDivergent = parity.status === "divergence";

  return (
    <Link
      to={`/underwriting/app/${application.id}/eligibility`}
      className={cn(
        "group flex items-center justify-between gap-6 rounded-xl bg-ew-bg-primary p-4 transition-colors hover:bg-ew-bg-secondary/40",
        isDivergent
          ? "border-[0.5px] border-ew-warning-text/40"
          : "border-[0.5px] border-ew-border",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <span className="w-24 shrink-0 font-mono text-[12px] text-ew-text-tertiary">
          {application.id}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="truncate text-[14px] font-medium text-ew-text-primary">
            {application.borrowerName}
          </div>
          <div className="truncate text-[12px] text-ew-text-tertiary">
            {application.product}
          </div>
        </div>
        <span className="hidden shrink-0 text-[14px] tabular-nums text-ew-text-secondary sm:inline">
          {formatAmount(application.amount)}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {isAnalyzing ? (
          <span className="inline-flex items-center gap-2 text-[12px] text-ew-text-secondary">
            <Spinner className="size-3.5" />
            Analyzing…
          </span>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <VerdictPill verdict={verdict} />
              <span className="text-[12px] tabular-nums text-ew-text-tertiary">
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <ParityIcon status={parity.status} className="hidden md:inline-flex" />
          </>
        )}
        <ChevronRight className="size-4 text-ew-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-ew-text-primary" />
      </div>
    </Link>
  );
}
