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
import type { Order } from '@/features/picking/types';
import { useSyncStore } from '@/features/sync/store/sync.store';
import { firestore } from '@/services/firebase';

/**
 * Carga la cola del chequeador: Empaquetado + pausados, en un solo refresh.
 * Fetch puntual (no realtime) — con muchos chequeadores, un onSnapshot sobre
 * toda la cola sale caro. Se dispara al montar y bajo demanda (refresh).
 */
export function useAuditQueueRefresh() {
  const user = useCurrentUser();
  const { t } = useTranslation();
  const upsertOrders = useOrdersStore((s) => s.upsertOrders);
  const removeOrdersWhere = useOrdersStore((s) => s.removeOrdersWhere);
  const [refreshing, setRefreshing] = useState(false);
  const prevSnapshotRef = useRef<Map<string, OrderSnapshotSig> | null>(null);

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'auditor') return;
    setRefreshing(true);
    try {
      const [packedSnap, pausedSnap] = await Promise.all([
        firestore().collection('lo_orders').where('status', '==', 'Empaquetado').get(),
        firestore().collection('lo_orders').where('is_paused', '==', true).get(),
      ]);

      // Offline el `get()` resuelve desde caché sin fallar: la metadata es lo
      // único que delata que no se habló con el servidor.
      useSyncStore.getState().setSyncStatus({
        fromCache: packedSnap.metadata.fromCache || pausedSnap.metadata.fromCache,
        hasPendingWrites:
          packedSnap.metadata.hasPendingWrites || pausedSnap.metadata.hasPendingWrites,
      });

      const byId = new Map<string, Order>();
      for (const doc of packedSnap.docs) {
        byId.set(doc.id, firestoreDocToOrder(doc.id, doc.data()));
      }
      for (const doc of pausedSnap.docs) {
        byId.set(doc.id, firestoreDocToOrder(doc.id, doc.data()));
      }
      const mapped = Array.from(byId.values());
      const ids = new Set(byId.keys());

      upsertOrders(mapped);
      removeOrdersWhere((o) => (o.status === 'to_pack' || o.isPaused) && !ids.has(o.id));

      const derived = deriveOrderNotifications(user.role, prevSnapshotRef.current, mapped, t);
      for (const n of derived) notify(n);

      prevSnapshotRef.current = toSnapshotMap(mapped);
    } catch (err) {
      console.error('[useAuditQueueRefresh]', err);
    } finally {
      setRefreshing(false);
    }
  }, [user, upsertOrders, removeOrdersWhere, t]);

  useEffect(() => {
    // No notificar de lo preexistente en la primera carga de la sesión.
    prevSnapshotRef.current = null;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return { refreshing, refresh };
}
