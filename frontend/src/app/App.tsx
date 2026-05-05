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
    useAuthStore.getState().hydrate();
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
