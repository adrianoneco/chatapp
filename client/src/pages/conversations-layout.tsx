import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { ProtectedRoute } from "@/components/protected-route";

interface ConversationsLayoutProps {
  children: React.ReactNode;
}

export function ConversationsLayout({ children }: ConversationsLayoutProps) {
  const style = {
    "--sidebar-width": "0rem",
    "--sidebar-width-icon": "0rem",
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "attendant"]}>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex flex-col h-screen w-full">
          <AppHeader />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
