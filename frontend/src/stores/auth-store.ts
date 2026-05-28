import { create } from "zustand";
import api from "@/services/api";
import { loginRequest, msalInstance, msalReady, redirectResult } from "@/lib/msalConfig";

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  azureId: string;
}

interface ExchangeResponse extends AuthUser {
  sessionExpiresAt: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpiresAt: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleRedirectResult: () => Promise<void>;
  hydrate: () => Promise<void>;
}

function setAuthenticated(
  set: (partial: Partial<AuthState>) => void,
  data: AuthUser,
  extra?: Partial<AuthState>,
) {
  set({
    user: {
      userId: data.userId,
      email: data.email,
      fullName: data.fullName,
      azureId: data.azureId,
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    ...extra,
  });
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  error: null,
  sessionExpiresAt: null,

  // Kick off the Microsoft sign-in redirect. Control leaves the SPA here; the
  // result is picked up by handleRedirectResult() once the browser returns.
  login: async () => {
    set({ isLoading: true, error: null });
    try {
      await msalReady;
      await msalInstance.loginRedirect(loginRequest);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      set({ isLoading: false, error: message });
    }
  },

  // After Microsoft redirects back, exchange the Entra idToken for a backend
  // session cookie (blm pattern). No-op on a normal page load (no redirect).
  handleRedirectResult: async () => {
    try {
      const result = await redirectResult;
      if (!result) return;

      const response = await api.post<ExchangeResponse>("/api/v1/auth/exchange", null, {
        headers: { Authorization: `Bearer ${result.idToken}` },
      });

      setAuthenticated(set, response.data, {
        sessionExpiresAt: response.data.sessionExpiresAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      set({ isLoading: false, error: message });
    }
  },

  // Restore the session on app startup from the HttpOnly cookie via /me.
  hydrate: async () => {
    try {
      const response = await api.get<AuthUser>("/api/v1/auth/me");
      setAuthenticated(set, response.data, { isHydrated: true });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isHydrated: true,
        sessionExpiresAt: null,
      });
    }
  },

  logout: async () => {
    set({ user: null, isAuthenticated: false, error: null, sessionExpiresAt: null });
    try {
      await api.post("/api/v1/auth/logout");
    } catch {
      // best-effort — backend may already have cleared the cookie
    }
    try {
      await msalReady;
      await msalInstance.logoutRedirect({ postLogoutRedirectUri: "/login" });
    } catch {
      // silent fail — user is already logged out locally
    }
  },
}));
