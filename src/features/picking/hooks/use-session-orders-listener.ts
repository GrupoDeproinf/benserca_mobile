import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { notify } from '@/features/notifications/store/notifications.store';
import {
  deriveOrderNotifications,
  toSnapshotMap,
  type OrderSnapshotSig,
} from '@/features/notifications/utils/order-notifications';
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
 * Además de hidratar el store, deriva las notificaciones in-app comparando el
 * snapshot anterior con el nuevo (ver order-notifications). Las notificaciones
 * se generan siempre en el dispositivo del receptor.
 *
 * Montado una sola vez en (app)/_layout.tsx. Ninguna pantalla individual
 * abre listeners adicionales; leen del store que este hook mantiene fresco.
 */
export function useSessionOrdersListener() {
  const user = useCurrentUser();
  const { t } = useTranslation();
  const hydrateOrders = useOrdersStore((s) => s.hydrateOrders);
  const prevSnapshotRef = useRef<Map<string, OrderSnapshotSig> | null>(null);

  useEffect(() => {
    if (!user) return;

    // Nueva suscripción → reinicia la referencia para no notificar lo preexistente.
    prevSnapshotRef.current = null;

    const col = firestore().collection('lo_orders');

    const buildQuery = () => {
      switch (user.role) {
        case 'picker':
          return col.where('assigned_to.uid', '==', user.uid);
        case 'auditor':
          return col.where('status', '==', 'Empaquetado');
        case 'warehouse_lead':
          return col.where('team.chief_uid', '==', user.uid);
        case 'supervisor_almacen':
          // Visualizador: ve TODOS los pedidos del almacén, sin filtro.
          return col;
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

        const derived = deriveOrderNotifications(
          user.role,
          prevSnapshotRef.current,
          mapped,
          t,
        );
        for (const n of derived) notify(n);

        prevSnapshotRef.current = toSnapshotMap(mapped);
      },
      (err) => {
        console.error('[useSessionOrdersListener]', err);
      },
    );

    return unsub;
  }, [user?.uid, user?.role, hydrateOrders, t]);
}
