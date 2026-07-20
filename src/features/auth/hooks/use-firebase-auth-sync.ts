import { useEffect } from 'react';
import { firestore, auth } from '@/services/firebase';
import { safeFirebaseSignOut } from '@/services/firebase/auth-utils';
import { fetchSessionUser } from '@/services/firebase/user-profile';
import {
  FirestorePermissionError,
  InvalidProfileError,
  ProfileNotFoundError,
} from '@/features/auth/errors/auth.errors';
import { useAuthStore } from '@/features/auth/store/auth.store';

/**
 * Sincroniza Firebase Auth con el store local al iniciar y ante cambios de sesión.
 */
export function useFirebaseAuthSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const signOut = useAuthStore((s) => s.signOut);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          signOut();
          return;
        }

        const sessionUser = await fetchSessionUser(firebaseUser);
        setUser(sessionUser);

        if (sessionUser.role === 'picker') {
          firestore()
            .collection('u_pickers')
            .doc(sessionUser.uid)
            .update({ last_activity_at: new Date().toISOString() })
            .catch(() => {
              // No crítico: si falla (ej. doc no existe con ese uid), no bloquea el login.
            });
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[auth] Firebase session sync failed:', error);
        }
        if (
          error instanceof ProfileNotFoundError ||
          error instanceof InvalidProfileError ||
          error instanceof FirestorePermissionError
        ) {
          await safeFirebaseSignOut();
        }
        signOut();
      } finally {
        setHydrated();
      }
    });

    return unsubscribe;
  }, [setUser, signOut, setHydrated]);
}
