import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { LanguageProvider } from "@/hooks/use-language";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/admin-route";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Meetings from "@/pages/meetings";
import PastMeetings from "@/pages/past-meetings";
import AdminDashboard from "@/pages/admin/dashboard";
import Navbar from "@/components/navbar";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/meetings" component={Meetings} />
      <ProtectedRoute path="/past-meetings" component={PastMeetings} />
      <AdminRoute path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { connected } = useNotifications();

  return (
    <>
      <Navbar />
      <Router />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;