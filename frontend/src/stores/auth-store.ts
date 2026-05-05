import { create } from "zustand";

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  azureId: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "aa_auth_user";

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed?.userId && parsed?.email) return parsed;
    return null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  error: null,

  login: async (email: string) => {
    set({ isLoading: true, error: null });
    const trimmed = email.trim();
    if (!trimmed) {
      set({ isLoading: false, error: "Email is required" });
      return;
    }
    const user: AuthUser = {
      userId: crypto.randomUUID(),
      email: trimmed,
      fullName: trimmed.split("@")[0] ?? trimmed,
      azureId: "stub",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false, error: null });
  },

  logout: async () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, isAuthenticated: false, error: null });
  },

  hydrate: async () => {
    const user = readStoredUser();
    set({
      user,
      isAuthenticated: user !== null,
      isHydrated: true,
    });
  },
}));
