import { useEffect } from 'react';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { firestore } from '@/services/firebase';
import { firestoreDocToOrder } from '../services/orders.mapper';
import { useOrdersStore } from '../store/orders.store';

/**
 * Un único listener de Firestore activo durante toda la sesión autenticada.
 * Se suscribe según el rol del usuario:
 *   - picker         → sus pedidos (assigned_to.uid)
 *   - auditor        → pedidos en "Empaquetado"
 *   - warehouse_lead → pedidos de su equipo (team.chief_uid)
 *
 * Montado una sola vez en (app)/_layout.tsx. Ninguna pantalla individual
 * abre listeners adicionales; leen del store que este hook mantiene fresco.
 */
export function useSessionOrdersListener() {
  const user = useCurrentUser();
  const hydrateOrders = useOrdersStore((s) => s.hydrateOrders);

  useEffect(() => {
    if (!user) return;

    const col = firestore().collection('lo_orders');

    const buildQuery = () => {
      switch (user.role) {
        case 'picker':
          return col.where('assigned_to.uid', '==', user.uid);
        case 'auditor':
          return col.where('status', '==', 'Empaquetado');
        case 'warehouse_lead':
          return col.where('team.chief_uid', '==', user.uid);
        default:
          return null;
      }
    };

    const query = buildQuery();
    if (!query) return;

    const unsub = query.onSnapshot(
      (snapshot) => {
        const mapped = snapshot.docs.map((doc) =>
          firestoreDocToOrder(doc.id, doc.data()),
        );
        hydrateOrders(mapped);
      },
      (err) => {
        console.error('[useSessionOrdersListener]', err);
      },
    );

    return unsub;
  }, [user?.uid, user?.role, hydrateOrders]);
}
