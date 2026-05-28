import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";

interface LocationState {
  from?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);

  // Redirect once authenticated. When the user was bounced here by
  // ProtectedRoute, send them back to where they came from; otherwise home.
  useEffect(() => {
    if (!isAuthenticated) return;
    const state = location.state as LocationState | null;
    const destination = state?.from && state.from !== "/login" ? state.from : "/";
    navigate(destination, { replace: true });
  }, [isAuthenticated, location.state, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex aspect-square size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Analyzers</h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your work account to continue.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => login()}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner className="size-4" />
              Signing in…
            </>
          ) : (
            <>
              <MicrosoftIcon />
              Sign in with Microsoft
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Restricted to authorized LendLogic users.
        </p>
      </div>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden focusable="false">
      <rect x="1" y="1" width="10" height="10" fill="#f25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
      <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
      <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
    </svg>
  );
}
