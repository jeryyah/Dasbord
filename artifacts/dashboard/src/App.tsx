import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetAdminMe } from "@workspace/api-client-react";
import { useEffect } from "react";

import { Layout } from "@/components/layout/sidebar";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Keys from "@/pages/keys";
import Logs from "@/pages/logs";
import ApiDocs from "@/pages/api-docs";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: any }) {
  const [, setLocation] = useLocation();
  const { data: me, isLoading } = useGetAdminMe();

  useEffect(() => {
    if (!isLoading && me && !me.loggedIn) {
      setLocation("/login");
    }
  }, [me, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!me || !me.loggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Root() {
  const [, setLocation] = useLocation();
  const { data: me, isLoading } = useGetAdminMe();

  useEffect(() => {
    if (!isLoading) {
      setLocation(me?.loggedIn ? "/dashboard" : "/login");
    }
  }, [me, isLoading, setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Root} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/keys">
        {() => <ProtectedRoute component={Keys} />}
      </Route>
      <Route path="/logs">
        {() => <ProtectedRoute component={Logs} />}
      </Route>
      <Route path="/api-docs">
        {() => <ProtectedRoute component={ApiDocs} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
