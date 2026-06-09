import { CreditCard, FileText, Landmark, type LucideIcon } from "lucide-react";
import type { AnalyzerType } from "./types";

export type UploadTone = "info" | "warning" | "success";

export interface AnalyzerOption {
  analyzer: AnalyzerType;
  description: string;
  icon: LucideIcon;
  tone: UploadTone;
  accept: string;
}

// The three analyzers a document can be routed to. Tones mirror the Files
// page storage strip (credit=info, bank=warning, id=success) so a document's
// category reads the same color across the Workspace. Shared by the full
// Upload page and the dashboard's Quick upload card.
export const ANALYZER_OPTIONS: AnalyzerOption[] = [
  {
    analyzer: "credit_report",
    description: "Bureau credit report (Equifax, Experian, TransUnion).",
    icon: FileText,
    tone: "info",
    accept: ".pdf",
  },
  {
    analyzer: "bank_statement",
    description: "Monthly account statement in PDF.",
    icon: Landmark,
    tone: "warning",
    accept: ".pdf",
  },
  {
    analyzer: "id_validation",
    description: "Government ID, passport or driver's license.",
    icon: CreditCard,
    tone: "success",
    accept: "image/*,.pdf",
  },
];

export const TONE_ICON: Record<UploadTone, string> = {
  info: "bg-ew-info-bg text-ew-info-text",
  warning: "bg-ew-warning-bg text-ew-warning-text",
  success: "bg-ew-success-bg text-ew-success-text",
};

export function uploadOption(a: AnalyzerType): AnalyzerOption {
  return ANALYZER_OPTIONS.find((o) => o.analyzer === a) ?? ANALYZER_OPTIONS[0];
}

export function isAnalyzerType(value: string | null | undefined): value is AnalyzerType {
  return (
    value === "credit_report" || value === "bank_statement" || value === "id_validation"
  );
}
