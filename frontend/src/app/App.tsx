import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppThemeProvider } from "@/theme/ThemeContext";
import { useAuthStore } from "@/stores/auth-store";
import { router } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      // Consume a Microsoft redirect (exchange idToken for a session cookie)
      // before checking the existing session, so a fresh sign-in hydrates too.
      await useAuthStore.getState().handleRedirectResult();
      if (cancelled) return;
      await useAuthStore.getState().hydrate();
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <RouterProvider router={router} />
          <Toaster richColors closeButton />
        </AppThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
