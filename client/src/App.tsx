import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
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

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <Redirect to="/login" />}
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      
      <Route path="/dashboard">
        {(params) => {
          if (params && Object.keys(params).length === 0) {
            return (
              <DashboardLayout>
                <DashboardHome />
              </DashboardLayout>
            );
          }
          return null;
        }}
      </Route>
      
      <Route path="/dashboard/conversations">
        {() => (
          <DashboardLayout>
            <Conversations />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/contacts">
        {() => (
          <DashboardLayout>
            <Contacts />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/attendants">
        {() => (
          <DashboardLayout>
            <Attendants />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/admins">
        {() => (
          <DashboardLayout>
            <Admins />
          </DashboardLayout>
        )}
      </Route>

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
      
      <Route path="/dashboard/settings">
        {() => (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/dashboard/settings/:tab">
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
        <WebSocketProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
