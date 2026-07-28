import { useEffect, useState } from 'react';
import { firestore } from '@/services/firebase';
import { firestoreDocToOrder } from '../services/orders.mapper';
import { useOrdersStore } from '../store/orders.store';

/**
 * Suscripción en tiempo real a un pedido específico.
 * Si el pedido no está en el store local lo agrega; si ya está, lo actualiza
 * respetando el estado local de bultos si está en progreso.
 */
export function useFirestoreOrder(orderId: string | null) {
  const upsertOrders = useOrdersStore((s) => s.upsertOrders);
  const order = useOrdersStore((s) => (orderId ? s.orders.find((o) => o.id === orderId) : undefined));
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setResolved(true);
      return;
    }

    setResolved(false);
    const unsub = firestore()
      .collection('lo_orders')
      .doc(orderId)
      .onSnapshot(
        (snap) => {
          if (snap.exists()) {
            const mapped = firestoreDocToOrder(snap.id, snap.data() ?? {});
            upsertOrders([mapped]);
          }
          setResolved(true);
        },
        (err) => {
          console.error('[useFirestoreOrder]', err);
          setResolved(true);
        },
      );

    return unsub;
  }, [orderId, upsertOrders]);

  return { order: order ?? null, loading: !resolved && !order };
}
