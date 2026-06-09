import type { ReactNode } from "react";

// Frame that fills the SidebarInset and applies the eligibility-workbench
// surface tokens. Every screen renders inside this so the design language is
// consistent and isolated from the rest of the app.
export function EligibilityShell({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-8 -my-10 min-h-[calc(100vh-3.5rem)] bg-ew-bg-tertiary text-ew-text-primary">
      <div className="mx-auto max-w-7xl px-8 py-8 [font-feature-settings:'cv02','cv03']">
        {children}
      </div>
    </div>
  );
}
