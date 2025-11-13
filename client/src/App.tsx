import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import DashboardPage from "@/pages/dashboard-page";
import ContactsPage from "@/pages/contacts-page";
import AttendantsPage from "@/pages/attendants-page";
import MeetingsPage from "@/pages/meetings-page";
import MeetingViewPage from "@/pages/meeting-view-page";
import ConversationsPage from "@/pages/conversations-page";
import SettingsPage from "@/pages/settings-page";
import AuthPage from "@/pages/auth-page";
import Error400 from "@/pages/error-400";
import Error401 from "@/pages/error-401";
import Error403 from "@/pages/error-403";
import Error404 from "@/pages/error-404";
import Error500 from "@/pages/error-500";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-full w-full">
            <AppSidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}

function DashboardWithLayout() {
  return (
    <AuthenticatedLayout>
      <DashboardPage />
    </AuthenticatedLayout>
  );
}

function ContactsWithLayout() {
  return (
    <AuthenticatedLayout>
      <ContactsPage />
    </AuthenticatedLayout>
  );
}

function AttendantsWithLayout() {
  return (
    <AuthenticatedLayout>
      <AttendantsPage />
    </AuthenticatedLayout>
  );
}

function MeetingsWithLayout() {
  return (
    <AuthenticatedLayout>
      <MeetingsPage />
    </AuthenticatedLayout>
  );
}

function ConversationsWithLayout() {
  return (
    <AuthenticatedLayout>
      <ConversationsPage />
    </AuthenticatedLayout>
  );
}

function SettingsWithLayout() {
  return (
    <AuthenticatedLayout>
      <SettingsPage />
    </AuthenticatedLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/m/:linkId" component={MeetingViewPage} />
      <Route path="/error/400" component={Error400} />
      <Route path="/error/401" component={Error401} />
      <Route path="/error/403" component={Error403} />
      <Route path="/error/404" component={Error404} />
      <Route path="/error/500" component={Error500} />
      <ProtectedRoute path="/conversations" component={ConversationsWithLayout} />
      <ProtectedRoute path="/contacts" component={ContactsWithLayout} />
      <ProtectedRoute path="/attendants" component={AttendantsWithLayout} />
      <ProtectedRoute path="/meetings" component={MeetingsWithLayout} />
      <ProtectedRoute path="/settings" component={SettingsWithLayout} />
      <ProtectedRoute path="/" component={DashboardWithLayout} />
      <Route component={Error404} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
