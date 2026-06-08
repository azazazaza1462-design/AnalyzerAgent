import type { ReactNode } from "react";

// Same outer frame used by the eligibility screens, so the Workspace and
// Underwriting feel like one app even though they own different data domains.
export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-8 -my-10 min-h-[calc(100vh-3.5rem)] bg-ew-bg-tertiary text-ew-text-primary">
      <div className="mx-auto max-w-7xl px-8 py-8 [font-feature-settings:'cv02','cv03']">
        {children}
      </div>
    </div>
  );
}
