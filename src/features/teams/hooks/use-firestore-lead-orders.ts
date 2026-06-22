import { useEffect } from 'react';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { firestoreDocToOrder } from '@/features/picking/services/orders.mapper';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { firestore } from '@/services/firebase';

/**
 * Suscripción en tiempo real a los pedidos asignados al jefe de almacén autenticado.
 * Los carga en el store compartido de órdenes.
 */
export function useFirestoreLeadOrders() {
  const user = useCurrentUser();
  const hydrateOrders = useOrdersStore((s) => s.hydrateOrders);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = firestore()
      .collection('lo_orders')
      .where('team.chief_uid', '==', user.uid)
      .onSnapshot(
        (snapshot) => {
          const mapped = snapshot.docs.map((doc) =>
            firestoreDocToOrder(doc.id, doc.data()),
          );
          hydrateOrders(mapped);
        },
        (err) => {
          console.error('[useFirestoreLeadOrders]', err);
        },
      );

    return unsub;
  }, [user?.uid, hydrateOrders]);
}
