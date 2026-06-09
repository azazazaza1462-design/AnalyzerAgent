import { Link, useLocation } from "react-router";
import { Activity, Folder, LayoutDashboard, ListChecks, Lock, LogOut, Moon, Scale, Sun, UploadCloud } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useThemeMode } from "@/theme/ThemeContext";
import { useAuthStore } from "@/stores/auth-store";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Upload", href: "/upload", icon: UploadCloud },
      { label: "Reports", href: "/reports", icon: ListChecks },
      { label: "Files", href: "/files", icon: Folder },
    ],
  },
  {
    label: "Underwriting",
    items: [
      { label: "Eligibility queue", href: "/underwriting/queue", icon: Scale },
      { label: "Model governance", href: "/underwriting/model/eligibility", icon: Lock },
    ],
  },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { mode, toggleTheme } = useThemeMode();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Analyzers">
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Activity className="size-5" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[14px] font-medium">Analyzers</span>
                  <span className="truncate text-[12px] text-muted-foreground">LendLogic</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link to={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              tooltip={mode === "dark" ? "Light mode" : "Dark mode"}
            >
              {mode === "dark" ? <Sun /> : <Moon />}
              <span>{mode === "dark" ? "Light mode" : "Dark mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => logout()} tooltip={user.email}>
                <LogOut />
                <span className="truncate">{user.email}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
