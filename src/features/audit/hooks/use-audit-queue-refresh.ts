import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { notify } from '@/features/notifications/store/notifications.store';
import {
  deriveOrderNotifications,
  toSnapshotMap,
  type OrderSnapshotSig,
} from '@/features/notifications/utils/order-notifications';
import { firestoreDocToOrder } from '@/features/picking/services/orders.mapper';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { firestore } from '@/services/firebase';

/**
 * Carga la cola de auditoría ("Empaquetado") con fetch puntual en vez de un
 * listener realtime — con muchos chequeadores conectados, un onSnapshot sobre
 * toda la cola sale caro. Se dispara al montar la pantalla y bajo demanda
 * (botón refresh / pull-to-refresh), y en cada refresh deriva las mismas
 * notificaciones "listo para chequear" que antes generaba el listener.
 */
export function useAuditQueueRefresh() {
  const user = useCurrentUser();
  const { t } = useTranslation();
  const hydrateOrders = useOrdersStore((s) => s.hydrateOrders);
  const [refreshing, setRefreshing] = useState(false);
  const prevSnapshotRef = useRef<Map<string, OrderSnapshotSig> | null>(null);

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'auditor') return;
    setRefreshing(true);
    try {
      const snapshot = await firestore()
        .collection('lo_orders')
        .where('status', '==', 'Empaquetado')
        .get();
      const mapped = snapshot.docs.map((doc) => firestoreDocToOrder(doc.id, doc.data()));
      hydrateOrders(mapped);

      const derived = deriveOrderNotifications(user.role, prevSnapshotRef.current, mapped, t);
      for (const n of derived) notify(n);

      prevSnapshotRef.current = toSnapshotMap(mapped);
    } catch (err) {
      console.error('[useAuditQueueRefresh]', err);
    } finally {
      setRefreshing(false);
    }
  }, [user, hydrateOrders, t]);

  useEffect(() => {
    // No notificar de lo preexistente en la primera carga de la sesión.
    prevSnapshotRef.current = null;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return { refreshing, refresh };
}
