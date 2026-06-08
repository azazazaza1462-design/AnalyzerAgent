import { type ReactNode } from "react";
import { useLocation } from "react-router";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

// The top bar label only orients the user at the section level. Each page
// renders its own breadcrumb (Viewnear › Analyzers · LendLogic › …) with the
// finer-grained navigation context.
function useSectionLabel(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith("/underwriting")) return "Underwriting workbench";
  if (pathname.startsWith("/reports")) return "Reports";
  if (pathname.startsWith("/files")) return "Files";
  return "Workspace";
}

export function AppLayout({ children }: AppLayoutProps) {
  const section = useSectionLabel();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <span className="text-[12px] font-medium text-muted-foreground">{section}</span>
        </header>
        <div className="flex-1 overflow-auto px-8 py-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
