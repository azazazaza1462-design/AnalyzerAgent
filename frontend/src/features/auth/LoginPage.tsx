import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      const state = location.state as LocationState | null;
      const destination = state?.from && state.from !== "/login" ? state.from : "/";
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(email);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm"
      >
        <div className="space-y-2 text-center">
          <div className="mx-auto flex aspect-square size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">Analyzers</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue (dev mode)</p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Input
            type="email"
            placeholder="you@viewnear.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
