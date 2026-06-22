import { useEffect } from 'react';
import { firestore } from '@/services/firebase';
import { firestoreDocToOrder } from '../services/orders.mapper';
import { useOrdersStore } from '../store/orders.store';

/**
 * Suscripción en tiempo real a un pedido específico.
 * Si el pedido no está en el store local lo agrega; si ya está, lo actualiza
 * respetando el estado local de bultos si está en progreso.
 */
export function useFirestoreOrder(orderId: string | null) {
  const hydrateOrders = useOrdersStore((s) => s.hydrateOrders);
  const order = useOrdersStore((s) => (orderId ? s.orders.find((o) => o.id === orderId) : undefined));

  useEffect(() => {
    if (!orderId) return;

    const unsub = firestore()
      .collection('lo_orders')
      .doc(orderId)
      .onSnapshot(
        (snap) => {
          if (!snap.exists()) return;
          const mapped = firestoreDocToOrder(snap.id, snap.data() ?? {});
          hydrateOrders([mapped]);
        },
        (err) => {
          console.error('[useFirestoreOrder]', err);
        },
      );

    return unsub;
  }, [orderId, hydrateOrders]);

  return order ?? null;
}
