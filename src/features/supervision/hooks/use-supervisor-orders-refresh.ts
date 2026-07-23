import { useCallback, useState } from 'react';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { firestoreDocToOrder } from '@/features/picking/services/orders.mapper';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { useSyncStore } from '@/features/sync/store/sync.store';
import { firestore } from '@/services/firebase';

/**
 * Refresh manual para las pantallas del supervisor de almacén (botón y
 * pull-to-refresh). El listener de sesión ya mantiene el store al día, así que
 * esto es una relectura puntual bajo demanda: mismo alcance que el listener
 * (todos los pedidos del almacén) para no dejar el store a medias.
 */
export function useSupervisorOrdersRefresh() {
  const user = useCurrentUser();
  const hydrateOrders = useOrdersStore((s) => s.hydrateOrders);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'supervisor_almacen') return;
    setRefreshing(true);
    try {
      const snapshot = await firestore().collection('lo_orders').get();
      // Sin red el `get()` responde desde caché sin error: la metadata es lo
      // que permite avisar que lo mostrado no viene del servidor.
      useSyncStore.getState().setSyncStatus({
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
      hydrateOrders(snapshot.docs.map((doc) => firestoreDocToOrder(doc.id, doc.data())));
    } catch (err) {
      console.error('[useSupervisorOrdersRefresh]', err);
    } finally {
      setRefreshing(false);
    }
  }, [user, hydrateOrders]);

  return { refreshing, refresh };
}
