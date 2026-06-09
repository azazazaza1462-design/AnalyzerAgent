import { Fragment } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import type { Application } from "../types";

interface Crumb {
  label: string;
  href?: string;
}

interface AppHeaderProps {
  crumbs: Crumb[];
  app?: Application;
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function AppHeader({ crumbs, app }: AppHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between gap-6">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5 text-[12px] text-ew-text-tertiary">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <Fragment key={`${c.label}-${i}`}>
                {c.href && !isLast ? (
                  <li>
                    <Link
                      to={c.href}
                      className="transition-colors hover:text-ew-text-primary"
                    >
                      {c.label}
                    </Link>
                  </li>
                ) : (
                  <li className={isLast ? "text-ew-text-primary" : undefined}>{c.label}</li>
                )}
                {!isLast && (
                  <li aria-hidden>
                    <ChevronRight className="size-3" />
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>

      {app && (
        <div className="flex shrink-0 items-center gap-3 text-[12px] text-ew-text-secondary">
          <span className="font-medium text-ew-text-primary">{app.id}</span>
          <span aria-hidden className="text-ew-text-tertiary">
            ·
          </span>
          <span>{app.borrowerName}</span>
          <span aria-hidden className="text-ew-text-tertiary">
            ·
          </span>
          <span>{app.product}</span>
          <span aria-hidden className="text-ew-text-tertiary">
            ·
          </span>
          <span className="tabular-nums">{formatAmount(app.amount)}</span>
        </div>
      )}
    </div>
  );
}
