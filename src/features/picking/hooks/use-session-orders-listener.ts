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
import type { Order } from '../types';
import { useOrdersStore } from '../store/orders.store';

/**
 * Un único listener de Firestore activo durante toda la sesión autenticada.
 * Se suscribe según el rol del usuario:
 *   - picker         → sus pedidos individuales (assigned_to.uid) MÁS los
 *                       pedidos de equipo donde forma parte (team.picker_uids,
 *                       ver lead-assign-pickers / teams.store).
 *   - warehouse_lead → pedidos de su equipo (team.chief_uid)
 *
 * El auditor NO usa este listener: con muchos chequeadores conectados, un
 * onSnapshot sobre toda la cola "Empaquetado" resulta caro. En su lugar usa
 * fetch manual (ver useAuditQueueRefresh), disparado al entrar a la pantalla
 * y con un botón de refresh explícito.
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

    const emit = (mapped: Order[]) => {
      hydrateOrders(mapped);

      const derived = deriveOrderNotifications(user.role, prevSnapshotRef.current, mapped, t);
      for (const n of derived) notify(n);

      prevSnapshotRef.current = toSnapshotMap(mapped);
    };

    if (user.role === 'picker') {
      // Firestore no permite consultar por OR entre dos campos distintos, así
      // que se combinan dos listeners (asignación individual + equipo) y se
      // deduplica por id antes de hidratar el store.
      const bySelf = new Map<string, Order>();
      const byTeam = new Map<string, Order>();

      const emitMerged = () => {
        const merged = new Map<string, Order>([...bySelf, ...byTeam]);
        emit([...merged.values()]);
      };

      const unsubSelf = col.where('assigned_to.uid', '==', user.uid).onSnapshot(
        (snapshot) => {
          bySelf.clear();
          for (const doc of snapshot.docs) {
            bySelf.set(doc.id, firestoreDocToOrder(doc.id, doc.data()));
          }
          emitMerged();
        },
        (err) => console.error('[useSessionOrdersListener] picker self', err),
      );

      const unsubTeam = col
        .where('team.picker_uids', 'array-contains', user.uid)
        .onSnapshot(
          (snapshot) => {
            byTeam.clear();
            for (const doc of snapshot.docs) {
              byTeam.set(doc.id, firestoreDocToOrder(doc.id, doc.data()));
            }
            emitMerged();
          },
          (err) => console.error('[useSessionOrdersListener] picker team', err),
        );

      return () => {
        unsubSelf();
        unsubTeam();
      };
    }

    const buildQuery = () => {
      switch (user.role) {
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
        const mapped = snapshot.docs.map((doc) => firestoreDocToOrder(doc.id, doc.data()));
        emit(mapped);
      },
      (err) => {
        console.error('[useSessionOrdersListener]', err);
      },
    );

    return unsub;
  }, [user?.uid, user?.role, hydrateOrders, t]);
}
