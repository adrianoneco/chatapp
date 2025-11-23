import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login-page";
import RegisterPage from "@/pages/register-page";
import RecoverPasswordPage from "@/pages/recover-password-page";
import Dashboard from "@/pages/dashboard";
import Conversations from "@/pages/conversations";
import Contacts from "@/pages/contacts";
import Attendants from "@/pages/attendants";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import { useCurrentUser } from "@/lib/api";
import { useWebSocket } from "@/lib/websocket";
import { ReactNode } from "react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !data?.user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function WebSocketManager() {
  useWebSocket();
  return null;
}

function Router() {
  return (
    <>
      <WebSocketManager />
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/recover" component={RecoverPasswordPage} />
        
        <Route path="/">
          {() => <ProtectedRoute component={Dashboard} />}
        </Route>
        <Route path="/conversations">
          {() => <ProtectedRoute component={Conversations} />}
        </Route>
        <Route path="/conversations/webchat/:id">
          {() => <ProtectedRoute component={Conversations} />}
        </Route>
        <Route path="/contacts">
          {() => <ProtectedRoute component={Contacts} />}
        </Route>
        <Route path="/attendants">
          {() => <ProtectedRoute component={Attendants} />}
        </Route>
        <Route path="/settings">
          {() => <ProtectedRoute component={Settings} />}
        </Route>
        <Route path="/notifications">
          {() => <ProtectedRoute component={Notifications} />}
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
