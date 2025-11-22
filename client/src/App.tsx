import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { WebSocketProvider } from "@/lib/websocket";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import { DashboardLayout } from "@/pages/dashboard";
import { ConversationsLayout } from "@/pages/conversations-layout";
import DashboardHome from "@/pages/dashboard-home";
import Conversations from "@/pages/conversations";
import Contacts from "@/pages/contacts";
import Attendants from "@/pages/attendants";
import Admins from "@/pages/admins";
import Settings from "@/pages/settings";
import ApiDocs from "@/pages/api-docs";
import DebugSession from "@/pages/debug-session";

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <DashboardLayout>
            <DashboardHome />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/docs" component={ApiDocs} />
      <Route path="/debug/session" component={DebugSession} />



      <Route path="/attendants">
        {() => (
          <DashboardLayout>
            <Attendants />
          </DashboardLayout>
        )}
      </Route>

      <Route path="/admins">
        {() => (
          <DashboardLayout>
            <Admins />
          </DashboardLayout>
        )}
      </Route>

      <Route path="/contacts">
        {() => (
          <DashboardLayout>
            <Contacts />
          </DashboardLayout>
        )}
      </Route>

      <Route path="/conversations">
        {() => (
          <ConversationsLayout>
            <Conversations />
          </ConversationsLayout>
        )}
      </Route>

      <Route path="/conversations/:channelId/:conversationId">
        {() => (
          <ConversationsLayout>
            <Conversations />
          </ConversationsLayout>
        )}
      </Route>

      <Route path="/settings">
        {() => (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        )}
      </Route>

      <Route path="/settings/:tab">
        {() => (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* AuthGate: wait for auth check to finish before mounting WS/Router */}
        <AuthGate>
          <WebSocketProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </WebSocketProvider>
        </AuthGate>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default App;
