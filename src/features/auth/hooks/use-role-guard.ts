import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { getRoleHomePath, getRoleRouteSegment } from '../constants/routes';
import { useAuthStore } from '../store/auth.store';

/**
 * Impide que un rol autenticado navegue a rutas de otro rol dentro de `(app)`.
 */
export function useRoleGuard() {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated || !user) return;

    const inAppGroup = segments[0] === '(app)';
    if (!inAppGroup) return;

    const currentSegment = segments[1];
    const allowedSegment = getRoleRouteSegment(user.role);

    if (!currentSegment || currentSegment !== allowedSegment) {
      router.replace(getRoleHomePath(user.role));
    }
  }, [isHydrated, user, segments, router]);
}
