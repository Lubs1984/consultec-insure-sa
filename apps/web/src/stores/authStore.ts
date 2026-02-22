import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@insureconsultec/shared';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      setAccessToken: (accessToken) =>
        set({ accessToken }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'insureconsultec-auth',
      partialize: (state) => ({
        // Only persist user info — never persist the access token (it lives in memory)
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
