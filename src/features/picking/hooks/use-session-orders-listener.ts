import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { notify } from '@/features/notifications/store/notifications.store';
import {
  deriveOrderNotifications,
  toSnapshotMap,
  type OrderSnapshotSig,
} from '@/features/notifications/utils/order-notifications';
import { useSyncStore } from '@/features/sync/store/sync.store';
import { firestore } from '@/services/firebase';
import { createIncrementalMapper } from '@/services/firebase/incremental-snapshot';
import { firestoreDocToOrder } from '../services/orders.mapper';
import { STATUS_TO_FIRESTORE } from '../services/orders.service';
import type { Order } from '../types';
import { useOrdersStore } from '../store/orders.store';

/**
 * Un único listener de Firestore activo durante toda la sesión autenticada.
 * Se suscribe según el rol del usuario:
 *   - picker         → sus pedidos individuales (assigned_to.uid) MÁS los
 *                       pedidos de equipo donde forma parte (team.picker_uids,
 *                       ver lead-assign-pickers / teams.store).
 *   - warehouse_lead → pedidos de su equipo (team.chief_uid) MÁS los que
 *                       tiene asignados como picker (assigned_to.uid).
 *   - pedido_cargador → todos los pedidos Embalados del almacén (listos para
 *                       subir al camión). Es una cola acotada: al despachar,
 *                       el pedido sale de la query.
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

    const trackSyncStatus = (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
      useSyncStore.getState().setSyncStatus({
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    };

    /**
     * Con `includeMetadataChanges` llegan snapshots que solo confirman lo que ya
     * teníamos. Remapearlos no cambia nada y sí genera trabajo (merge del store,
     * re-render, guardado en disco), así que se descartan.
     */
    const isMetadataOnly = (snapshot: FirebaseFirestoreTypes.QuerySnapshot) =>
      prevSnapshotRef.current !== null && snapshot.docChanges().length === 0;

    const emit = (mapped: Order[]) => {
      hydrateOrders(mapped);

      const derived = deriveOrderNotifications(user.role, prevSnapshotRef.current, mapped, t);
      for (const n of derived) notify(n);

      prevSnapshotRef.current = toSnapshotMap(mapped);
    };

    // Firestore no permite consultar por OR entre dos campos distintos, así que
    // los roles con dos criterios abren un listener por criterio y se deduplica
    // por id antes de hidratar el store.
    const buildQueries = (): FirebaseFirestoreTypes.Query[] => {
      switch (user.role) {
        case 'picker':
          // Asignación individual + pedidos de equipo.
          return [
            col.where('assigned_to.uid', '==', user.uid),
            col.where('team.picker_uids', 'array-contains', user.uid),
          ];
        case 'warehouse_lead':
          // Además de los pedidos de su equipo, los que tiene a su nombre como
          // picker: si a un picker lo pasan a jefe con pedidos ya asignados,
          // esos pedidos conservan el `team.chief_uid` del jefe anterior y sin
          // este listener desaparecerían de su lista.
          return [
            col.where('team.chief_uid', '==', user.uid),
            col.where('assigned_to.uid', '==', user.uid),
          ];
        case 'supervisor_almacen':
          // Visualizador: ve TODOS los pedidos del almacén, sin filtro.
          return [col];
        case 'pedido_cargador':
          // En tiempo real (a diferencia del chequeador): mientras se carga el
          // camión se embalan pedidos nuevos, y si hay dos cargadores cada uno
          // debe ver los bultos que va marcando el otro.
          return [col.where('status', '==', STATUS_TO_FIRESTORE.packed)];
        default:
          return [];
      }
    };

    const queries = buildQueries();
    if (queries.length === 0) return;

    const results: Map<string, Order>[] = [];

    const emitMerged = () => {
      const merged = new Map<string, Order>();
      for (const result of results) {
        for (const [id, order] of result) merged.set(id, order);
      }
      emit([...merged.values()]);
    };

    // `includeMetadataChanges` habilita el estado de sincronización: Firestore
    // avisa si el snapshot vino de caché (sin servidor) y si quedan escrituras
    // sin confirmar. Ver sync.store.
    const unsubs = queries.map((query, index) => {
      const result = new Map<string, Order>();
      results.push(result);
      const mapOrders = createIncrementalMapper(firestoreDocToOrder);

      return query.onSnapshot(
        { includeMetadataChanges: true },
        (snapshot) => {
          trackSyncStatus(snapshot);
          if (isMetadataOnly(snapshot)) return;
          result.clear();
          for (const order of mapOrders(snapshot)) result.set(order.id, order);
          emitMerged();
        },
        (err) => console.error(`[useSessionOrdersListener] ${user.role} #${index}`, err),
      );
    });

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [user?.uid, user?.role, hydrateOrders, t]);
}
