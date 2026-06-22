import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SessionUser } from '@/shared/types';
import { zustandMMKVStorage } from '@/services/storage/mmkv';

export type { UserRole, SessionUser } from '@/shared/types';
export type User = SessionUser;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  signOut: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      signOut: () => set({ user: null, isAuthenticated: false }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);

export function useCurrentUser(): User | null {
  return useAuthStore((s) => s.user);
}
