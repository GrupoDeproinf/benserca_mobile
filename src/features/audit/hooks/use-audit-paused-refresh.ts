import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { firestoreDocToOrder } from '@/features/picking/services/orders.mapper';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { Order } from '@/features/picking/types';
import { firestore } from '@/services/firebase';

/**
 * Cola de pedidos pausados para el auditor: a diferencia de la cola normal
 * (`use-audit-queue-refresh.ts`, filtrada por status "Empaquetado"), esta
 * trae CUALQUIER pedido con `is_paused == true` sin importar su status, ya
 * que la pausa ocurre durante "En proceso" (antes de empaquetar). Fetch
 * puntual (no realtime), igual patrón que la cola normal.
 */
export function useAuditPausedRefresh() {
  const user = useCurrentUser();
  const hydrateOrders = useOrdersStore((s) => s.hydrateOrders);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'auditor') return;
    setRefreshing(true);
    try {
      const snapshot = await firestore()
        .collection('lo_orders')
        .where('is_paused', '==', true)
        .get();
      const mapped = snapshot.docs.map((doc) => firestoreDocToOrder(doc.id, doc.data()));
      hydrateOrders(mapped);
      if (mountedRef.current) setOrders(mapped);
    } catch (err) {
      console.error('[useAuditPausedRefresh]', err);
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [user, hydrateOrders]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return { orders, refreshing, refresh };
}
