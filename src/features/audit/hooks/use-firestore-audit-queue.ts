import { useEffect } from 'react';
import { firestore } from '@/services/firebase';
import { firestoreDocToOrder } from '@/features/picking/services/orders.mapper';
import { useOrdersStore } from '@/features/picking/store/orders.store';

/**
 * Suscripción en tiempo real a los pedidos con status "Empaquetado".
 * Los carga en el store compartido de órdenes.
 */
export function useFirestoreAuditQueue() {
  const hydrateOrders = useOrdersStore((s) => s.hydrateOrders);

  useEffect(() => {
    const unsub = firestore()
      .collection('lo_orders')
      .where('status', '==', 'Empaquetado')
      .onSnapshot(
        (snapshot) => {
          const mapped = snapshot.docs.map((doc) =>
            firestoreDocToOrder(doc.id, doc.data()),
          );
          hydrateOrders(mapped);
        },
        (err) => {
          console.error('[useFirestoreAuditQueue]', err);
        },
      );

    return unsub;
  }, [hydrateOrders]);
}
