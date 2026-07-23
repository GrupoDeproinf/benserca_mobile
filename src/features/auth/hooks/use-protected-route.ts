import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AUTH_ROUTES, getRoleHomePath } from '@/features/auth/constants/routes';
import { useAuthStore } from '@/features/auth/store/auth.store';

/**
 * Sin sesión → solo `(auth)`. Con sesión → home del rol en `(app)`.
 */
export function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    // El splash lo oculta `SplashGate`, que además hace el fade de salida.

    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === '(auth)';
    const inAppGroup = rootSegment === '(app)';

    if (!isAuthenticated || !user) {
      if (!inAuthGroup) {
        router.replace(AUTH_ROUTES.login);
      }
      return;
    }

    if (inAuthGroup) {
      router.replace(getRoleHomePath(user.role));
      return;
    }

    if (!inAppGroup) {
      router.replace(getRoleHomePath(user.role));
    }
  }, [isAuthenticated, isHydrated, user, segments, router]);
}
