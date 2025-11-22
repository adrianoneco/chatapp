import { useEffect } from "react";
import { useLocation } from "wouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { ProtectedRoute } from "@/components/protected-route";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === "/dashboard") {
      setLocation("/contacts");
    }
  }, [location, setLocation]);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <ProtectedRoute>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
