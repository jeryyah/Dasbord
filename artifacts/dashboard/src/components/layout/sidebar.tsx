import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useAdminLogout } from "@workspace/api-client-react";
import { LayoutDashboard, Key, ScrollText, LogOut, ShieldCheck, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const logoutMutation = useAdminLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
      },
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/keys", label: "License Keys", icon: Key },
    { href: "/logs", label: "Activity Logs", icon: ScrollText },
    { href: "/api-docs", label: "API Docs", icon: BookOpen },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-border bg-sidebar">
          <SidebarHeader className="px-5 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm text-foreground tracking-tight">HEADSETTING</div>
                <div className="text-[10px] text-muted-foreground tracking-widest font-medium">KEY MANAGER</div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <SidebarGroup>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">Navigation</div>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {navItems.map(({ href, label, icon: Icon }) => (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === href}
                        className="rounded-md h-9 px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                      >
                        <Link href={href}>
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto p-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent text-sm font-medium"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background">
          <div className="p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
