import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { APP_ROUTES, AUTH_ROUTES } from '@/features/auth/constants/routes';
import { useAuthStore } from '@/features/auth/store/auth.store';

/**
 * Redirige según sesión. Entrada no autenticada → login directo.
 */
export function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    SplashScreen.hideAsync().catch(() => null);

    const inAuthGroup = segments[0] === '(auth)';
    const authPage = segments[1];
    const isAuthForm = authPage === 'login';

    if (!isAuthenticated) {
      if (!inAuthGroup || !isAuthForm) {
        router.replace(AUTH_ROUTES.login);
      }
    } else if (isAuthenticated && inAuthGroup) {
      router.replace(APP_ROUTES.tabs);
    }
  }, [isAuthenticated, isHydrated, segments, router]);
}
