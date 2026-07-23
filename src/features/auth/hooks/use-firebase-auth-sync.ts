import { useEffect } from 'react';
import { firestore, auth } from '@/services/firebase';
import { safeFirebaseSignOut } from '@/services/firebase/auth-utils';
import { isOfflineError } from '@/services/firebase/offline-errors';
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

        // Sin red no se puede leer el perfil, pero la sesión de Firebase Auth
        // sigue siendo válida: se conserva el usuario persistido para que el
        // turno continúe offline. Cerrar sesión acá dejaría a la persona fuera
        // de la app sin manera de volver a entrar hasta recuperar internet.
        const offline = isOfflineError(error);
        const persistedUser = useAuthStore.getState().user;
        if (offline && persistedUser?.uid === firebaseUser?.uid) {
          return;
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
