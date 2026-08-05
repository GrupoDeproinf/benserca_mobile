import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import {
  clearOtherUsersLocalWork,
  flushLocalWork,
  loadLocalWork,
  saveLocalWorkDebounced,
} from '../services/orders-local-work';
import { useOrdersStore } from '../store/orders.store';

/**
 * Mantiene en disco el picking en curso y lo restaura al arrancar, para que
 * cerrar la app (o quedarse sin batería) no borre lo trabajado desde el último
 * hito guardado en Firestore. Se monta una sola vez en (app)/_layout.
 */
export function useLocalWorkPersistence() {
  const uid = useCurrentUser()?.uid;

  useEffect(() => {
    if (!uid) return;

    let active = true;

    loadLocalWork(uid).then((saved) => {
      if (!active) return;

      if (saved.length > 0) {
        useOrdersStore.getState().restoreLocalWork(saved);
      }

      // Después de cargar lo propio (y de migrar la clave vieja si era suya):
      // si quien abrió sesión es otro usuario, el respaldo del anterior ya no
      // se va a retomar en este dispositivo.
      void clearOtherUsersLocalWork(uid);
    });

    const unsubscribe = useOrdersStore.subscribe((state) => {
      saveLocalWorkDebounced(uid, state.orders);
    });

    // Al irse a background el proceso puede morir sin previo aviso: se vuelca
    // lo pendiente sin esperar el debounce.
    const appStateSub = AppState.addEventListener('change', (status) => {
      if (status !== 'active') flushLocalWork(uid, useOrdersStore.getState().orders);
    });

    return () => {
      active = false;
      unsubscribe();
      appStateSub.remove();
      flushLocalWork(uid, useOrdersStore.getState().orders);
    };
  }, [uid]);
}
