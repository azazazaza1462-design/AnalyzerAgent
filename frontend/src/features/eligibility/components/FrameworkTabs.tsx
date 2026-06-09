import { Cpu, FileText, Flag, ListChecks, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
  icon: LucideIcon;
  // Tabs other than AI are inert placeholders — the analyzer framework owns
  // them but this mockup only implements the AI eligibility tab.
  disabled?: boolean;
}

const TABS: Tab[] = [
  { key: "rules", label: "Rules engine", icon: ListChecks, disabled: true },
  { key: "ai", label: "AI eligibility analyzer", icon: Cpu },
  { key: "docs", label: "Document verification", icon: FileText, disabled: true },
  { key: "fraud", label: "Fraud signals", icon: Flag, disabled: true },
];

export function FrameworkTabs({ active = "ai" }: { active?: string }) {
  return (
    <div
      role="tablist"
      aria-label="Analyzer framework"
      className="-mb-px flex items-center gap-6 overflow-x-auto border-b-[0.5px] border-ew-border"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-1 py-3 text-[14px] transition-colors",
              isActive
                ? "border-ew-text-primary text-ew-text-primary font-medium"
                : "border-transparent text-ew-text-tertiary",
              !tab.disabled && !isActive && "hover:text-ew-text-secondary",
              tab.disabled && "cursor-not-allowed",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
