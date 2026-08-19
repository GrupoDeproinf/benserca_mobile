import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import { createNotification } from '@/services/firebase/notifications.service';
import type { SessionUser } from '@/shared/types';
import {
  applyAddBultoItem,
  applyApproveAudit,
  applyCloseBulto,
  applyDeleteBulto,
  applyFinishPicking,
  applyMarkDispatched,
  applyMarkWrapped,
  applyOpenBulto,
  applyPausePicking,
  applyQuickBundle,
  applyRejectAudit,
  applyRemoveBultoItem,
  applyReopenBulto,
  applyReopenForRevision,
  applyResumePicking,
  applyStartPicking,
  applyUpdateBultoItem,
  canCloseBulto,
  canFinishPicking,
  canOpenBulto,
} from '../domain/order-actions';
import {
  firestoreApproveAudit,
  firestoreAssignSelfAsPicker,
  firestoreFinishPicking,
  firestoreMarkDispatched,
  firestoreMarkWrapped,
  firestorePartialSave,
  firestorePausePicking,
  firestoreRejectAudit,
  firestoreReopenForRevision,
  firestoreResumePicking,
  firestoreStartPicking,
} from '../services/orders.service';
import type { Order, OrderStatus, PauseReason, PickerActionError } from '../types';
import { ensureItemLineIds } from '../utils/order-snapshot';
import { canPickerStartOrder } from '../utils/picker-queue';

/**
 * Notificaciones App→Web (channel `web`, `recipients: []` = broadcast) al
 * finalizar picking: SKUs faltantes y/o sustituciones. Ver notifications.md §2.6.
 */
function notifyFinishPickingOutcomes(order: Order, user: SessionUser): void {
  const orderNumber = Number(order.orderNumber);
  const missing = order.finalSkus.filter((s) => !s.substituted && s.difference > 0);
  const substituted = order.finalSkus.filter((s) => s.substituted);

  if (missing.length > 0) {
    const motivo = missing
      .map(
        (s) =>
          `Falta SKU ${s.originalSku} — cantidad pedida ${s.originalQuantity}, encontrada ${s.packedQuantity}`,
      )
      .join('; ');
    createNotification({
      message: `Picking finalizado con SKUs incompletos en el pedido #${order.orderNumber}`,
      type: 'picking_finished_incomplete',
      channel: 'web',
      recipients: [],
      orderNumber,
      motivo,
      createdBy: user.uid,
      createdByName: user.name,
    }).catch((e) => console.error('[orders.store] picking_finished_incomplete notify error', e));
  }

  if (substituted.length > 0) {
    const motivo = substituted
      .map(
        (s) =>
          `SKU ${s.originalSku} sustituido por ${s.packedSku}${s.substitutionNote ? ` (${s.substitutionNote})` : ''}`,
      )
      .join('; ');
    createNotification({
      message: `Se continuó el picking del pedido #${order.orderNumber} aunque hay SKUs diferentes`,
      type: 'picking_continued_with_mismatch',
      channel: 'web',
      recipients: [],
      orderNumber,
      motivo,
      createdBy: user.uid,
      createdByName: user.name,
    }).catch((e) =>
      console.error('[orders.store] picking_continued_with_mismatch notify error', e),
    );
  }
}

/** Notificación App→App (channel `app`) al picker cuando el chequeador resuelve el chequeo. */
function notifyAuditOutcome(
  order: Order,
  user: SessionUser,
  outcome: 'approved' | 'rejected',
  observation?: string,
): void {
  if (!order.assignedPickerId) return;

  const pickerName = usePickersStore.getState().getPicker(order.assignedPickerId)?.nombre;

  createNotification({
    message:
      outcome === 'approved'
        ? `El pedido #${order.orderNumber} fue aprobado por el chequeador`
        : `El pedido #${order.orderNumber} fue rechazado por el chequeador`,
    type: outcome === 'approved' ? 'order_audit_approved' : 'order_audit_rejected',
    channel: 'app',
    recipients: [{ uid: order.assignedPickerId, name: pickerName ?? order.assignedPickerId }],
    orderNumber: Number(order.orderNumber),
    motivo: observation,
    createdBy: user.uid,
    createdByName: user.name,
  }).catch((e) => console.error(`[orders.store] order_audit_${outcome} notify error`, e));
}

function patchOrder(orders: Order[], id: string, patch: Partial<Order>): Order[] {
  return orders.map((o) => (o.id === id ? { ...o, ...patch } : o));
}

/**
 * ¿El estado local y el remoto son del MISMO ciclo de asignación? Si al picker
 * le quitaron el pedido y se lo volvieron a asignar, `assigned_at` (o el uid
 * asignado) cambia: lo trabajado antes pertenece al ciclo anterior y no debe
 * arrastrarse al nuevo, que tiene que empezar limpio.
 */
function isSameAssignment(local: Order, remote: Order): boolean {
  return (
    local.assignedPickerId === remote.assignedPickerId && local.assignedAt === remote.assignedAt
  );
}

/**
 * Fusiona un pedido remoto con el local: en picking activo o si Firestore aún
 * no trae bultos, prevalece el estado local de bultos / progreso.
 */
function mergeIncomingOrder(firestoreOrder: Order, local: Order | undefined): Order {
  if (!local) return firestoreOrder;

  // Reasignado: lo local es de un ciclo anterior, manda el servidor.
  if (!isSameAssignment(local, firestoreOrder)) return firestoreOrder;

  // Preserve local bulto state if the order is actively being picked
  if (local.status === 'in_progress' && firestoreOrder.status === 'in_progress') {
    // Firestore may lag behind local state during active picking.
    // Keep all locally-computed picking fields authoritative.
    return {
      ...firestoreOrder,
      bultos: local.bultos,
      progressPercentage: local.progressPercentage,
      bundlesCreated: local.bundlesCreated,
      finalSkus: local.finalSkus,
      hasExtraBultos: local.hasExtraBultos,
      lastSavedMilestone: local.lastSavedMilestone,
      snapshotOriginal: local.snapshotOriginal ?? firestoreOrder.snapshotOriginal,
      // Se renumeran junto con los bultos al borrar uno (ver applyDeleteBulto),
      // así que mientras se pickea manda lo local igual que el resto.
      rejectedBundles: local.rejectedBundles,
      approvedBundles: local.approvedBundles,
    };
  }

  // Tras finalizar, Firestore puede llegar antes de tener final_skus mapeados.
  // Conservar bultos locales si el remoto aún no los trae.
  if (local.bultos.length > 0 && firestoreOrder.bultos.length === 0) {
    return {
      ...firestoreOrder,
      bultos: local.bultos,
      finalSkus: local.finalSkus.length > 0 ? local.finalSkus : firestoreOrder.finalSkus,
      progressPercentage:
        local.progressPercentage > 0 ? local.progressPercentage : firestoreOrder.progressPercentage,
      bundlesCreated:
        local.bundlesCreated > 0 ? local.bundlesCreated : firestoreOrder.bundlesCreated,
      hasExtraBultos: local.hasExtraBultos || firestoreOrder.hasExtraBultos,
      snapshotOriginal: local.snapshotOriginal ?? firestoreOrder.snapshotOriginal,
    };
  }

  return firestoreOrder;
}

type OpenBultoResult = { ok: true; isExtra: boolean } | { ok: false; error: PickerActionError };
type StartPickingResult = { ok: true } | { ok: false; error: 'already_active_order' };
type CloseBultoResult = { ok: true } | { ok: false; error: PickerActionError };
type FinishPickingResult = { ok: true } | { ok: false; error: PickerActionError };
type RemoveItemResult = { ok: true; bultoEmpty: boolean; bultoId: string; bultoNumber: number };

interface OrdersState {
  orders: Order[];
  /**
   * El listener ya trajo pedidos reales del servidor (o de su caché) en esta
   * sesión. Mientras sea `false` no se puede distinguir "este pedido ya no es
   * tuyo" de "todavía no llegó la lista", y `restoreLocalWork` necesita esa
   * distinción para no reinyectar un pedido reasignado.
   */
  hydratedFromServer: boolean;
  /** Reemplaza el store con pedidos desde Firestore, preservando estado local de bultos si el pedido está en progreso. */
  hydrateOrders: (incoming: Order[]) => void;
  /**
   * Inserta/actualiza pedidos sin borrar el resto del store.
   * Usar cuando varias fuentes parciales (cola auditoría + pausados, detalle
   * por id) coexisten; `hydrateOrders` es para sincronizaciones de lista completa.
   */
  upsertOrders: (incoming: Order[]) => void;
  /** Elimina pedidos que cumplan el predicado (p. ej. stale de una cola parcial). */
  removeOrdersWhere: (predicate: (order: Order) => boolean) => void;
  /** Reinyecta el picking en curso guardado en disco (ver orders-local-work). */
  restoreLocalWork: (saved: Order[]) => void;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrdersByPicker: (pickerId: string) => Order[];
  hasActiveOrder: (pickerId: string) => boolean;
  startPicking: (orderId: string, pickerId: string) => StartPickingResult;
  finishPicking: (orderId: string, pickerId: string) => FinishPickingResult;
  markWrapped: (orderId: string) => void;
  markDispatched: (orderId: string) => void;
  reopenForRevision: (orderId: string, pickerId: string) => void;
  /** Actualización optimista de `team.picker_uids` (el listener de Firestore la confirma). */
  setTeamPickers: (orderId: string, pickerUids: string[]) => void;
  /** El jefe de almacén se asigna el pedido a sí mismo para trabajarlo sin equipo. */
  assignSelfAsPicker: (orderId: string) => void;
  approveAudit: (orderId: string) => void;
  rejectAudit: (
    orderId: string,
    auditorId: string,
    auditorName: string,
    observation: string,
    rejectedBundles: number[],
    approvedBundles: number[],
  ) => void;
  pausePicking: (orderId: string, reason: PauseReason, missingSkus: string[]) => void;
  resumePicking: (orderId: string) => void;
  openBulto: (orderId: string) => OpenBultoResult;
  /**
   * Arma de un toque un bulto ya cerrado con `units_per_bundle` unidades de ese
   * renglón. Devuelve `false` si ya no queda un bulto completo por armar.
   */
  createQuickBundle: (orderId: string, lineId: string) => boolean;
  closeBulto: (orderId: string, bultoId: string) => CloseBultoResult;
  reopenBulto: (orderId: string, bultoId: string) => void;
  deleteBulto: (orderId: string, bultoId: string) => void;
  addBultoItem: (
    orderId: string,
    bultoId: string,
    /** Renglón del pedido al que se le suma (`OrderLine.id`). */
    lineId: string,
    sku: string,
    name: string,
    qty: number,
    options?: { originalSku?: string; substitutionNote?: string },
  ) => void;
  updateBultoItem: (orderId: string, bultoId: string, itemId: string, qty: number) => void;
  removeBultoItem: (orderId: string, bultoId: string, itemId: string) => RemoveItemResult;
  resetOrders: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  hydratedFromServer: false,

  hydrateOrders: (incoming) => {
    set((s) => {
      const localMap = new Map(s.orders.map((o) => [o.id, o]));
      return {
        orders: incoming.map((firestoreOrder) =>
          mergeIncomingOrder(firestoreOrder, localMap.get(firestoreOrder.id)),
        ),
        // Una lista vacía no confirma nada: puede ser una caché fría o un
        // arranque sin red, y ahí sí hay que poder restaurar desde disco.
        hydratedFromServer: s.hydratedFromServer || incoming.length > 0,
      };
    });
  },

  upsertOrders: (incoming) => {
    if (incoming.length === 0) return;
    set((s) => {
      const byId = new Map(s.orders.map((o) => [o.id, o]));
      for (const firestoreOrder of incoming) {
        byId.set(
          firestoreOrder.id,
          mergeIncomingOrder(firestoreOrder, byId.get(firestoreOrder.id)),
        );
      }
      return { orders: Array.from(byId.values()) };
    });
  },

  removeOrdersWhere: (predicate) => {
    set((s) => {
      const next = s.orders.filter((o) => !predicate(o));
      return next.length === s.orders.length ? s : { orders: next };
    });
  },

  restoreLocalWork: (saved) => {
    if (saved.length === 0) return;
    set((s) => {
      const savedMap = new Map(saved.map((o) => [o.id, o]));
      const merged = s.orders.map((current) => {
        const local = savedMap.get(current.id);
        savedMap.delete(current.id);
        if (!local) return current;

        // El pedido ya llegó del servidor (o de su caché): se respeta el estado
        // remoto salvo que siga en picking, donde lo local es lo más nuevo.
        if (current.status !== 'in_progress' || local.status !== 'in_progress') return current;

        // Mismo pedido pero otra asignación: se lo quitaron y se lo volvieron a
        // asignar, así que arranca limpio en vez de heredar bultos viejos.
        if (!isSameAssignment(local, current)) return current;

        return {
          ...current,
          // Lo guardado por una versión anterior no trae `lineId` en los ítems.
          bultos: ensureItemLineIds(local.bultos, current.lines),
          progressPercentage: local.progressPercentage,
          bundlesCreated: local.bundlesCreated,
          finalSkus: local.finalSkus,
          hasExtraBultos: local.hasExtraBultos,
          lastSavedMilestone: local.lastSavedMilestone,
          snapshotOriginal: local.snapshotOriginal ?? current.snapshotOriginal,
        };
      });

      // Lo guardado que aún no llegó del listener se agrega tal cual: sin red y
      // sin caché es la única copia del trabajo hecho. Pero si el listener YA
      // trajo la lista del servidor, que el pedido no esté en ella significa
      // que dejó de ser de este picker (reasignado, anulado): reinyectarlo lo
      // haría seguir pickeando un pedido que ya no le toca. Queda en disco, no
      // se pierde; simplemente no se muestra.
      if (s.hydratedFromServer) return { orders: merged };

      return { orders: [...merged, ...savedMap.values()] };
    });
  },

  getOrderById: (id) => get().orders.find((o) => o.id === id),
  getOrdersByStatus: (status) => get().orders.filter((o) => o.status === status),
  getOrdersByPicker: (pickerId) => get().orders.filter((o) => o.assignedPickerId === pickerId),
  hasActiveOrder: (pickerId) =>
    get().orders.some(
      (o) => o.assignedPickerId === pickerId && o.status === 'in_progress' && !o.isPaused,
    ),

  startPicking: (orderId, pickerId) => {
    const order = get().getOrderById(orderId);
    if (!order) return { ok: false, error: 'already_active_order' };

    const user = useAuthStore.getState().user;
    // El jefe de almacén puede llevar varios pedidos suyos a la vez: el límite
    // de un pedido activo es una regla del picker, no suya.
    if (user?.role !== 'warehouse_lead') {
      const check = canPickerStartOrder(get().hasActiveOrder(pickerId));
      if (!check.ok) return check;
    }

    const patch = applyStartPicking(order, pickerId);
    set((s) => ({ orders: patchOrder(s.orders, orderId, patch) }));

    if (user) {
      firestoreStartPicking(orderId, user).catch((e) =>
        console.error('[orders.store] startPicking Firestore error', e),
      );
    }

    return { ok: true };
  },

  finishPicking: (orderId, pickerId) => {
    const order = get().getOrderById(orderId);
    if (!order) return { ok: false, error: 'empty_open_bulto_exists' };

    const block = canFinishPicking(order);
    if (block) return { ok: false, error: block };

    const patch = applyFinishPicking(order, pickerId);
    set((s) => ({ orders: patchOrder(s.orders, orderId, patch) }));

    const updatedOrder = { ...order, ...patch };
    const user = useAuthStore.getState().user;
    if (user) {
      firestoreFinishPicking(orderId, updatedOrder, user).catch((e) =>
        console.error('[orders.store] finishPicking Firestore error', e),
      );
      notifyFinishPickingOutcomes(updatedOrder, user);
    }

    return { ok: true };
  },

  markWrapped: (orderId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({ orders: patchOrder(s.orders, orderId, applyMarkWrapped(order)) }));

    const user = useAuthStore.getState().user;
    if (user) {
      firestoreMarkWrapped(orderId, user).catch((e) =>
        console.error('[orders.store] markWrapped Firestore error', e),
      );
    }
  },

  markDispatched: (orderId) => {
    const order = get().getOrderById(orderId);
    if (!order || order.status !== 'packed') return;
    set((s) => ({ orders: patchOrder(s.orders, orderId, applyMarkDispatched(order)) }));

    const user = useAuthStore.getState().user;
    if (user) {
      firestoreMarkDispatched(orderId, user).catch((e) =>
        console.error('[orders.store] markDispatched Firestore error', e),
      );
    }
  },

  reopenForRevision: (orderId, pickerId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyReopenForRevision(order, pickerId)),
    }));

    const user = useAuthStore.getState().user;
    if (user) {
      firestoreReopenForRevision(orderId, user).catch((e) =>
        console.error('[orders.store] reopenForRevision Firestore error', e),
      );
    }
  },

  setTeamPickers: (orderId, pickerUids) => {
    set((s) => ({
      orders: patchOrder(s.orders, orderId, { teamPickerUids: pickerUids }),
    }));
  },

  assignSelfAsPicker: (orderId) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set((s) => ({
      orders: patchOrder(s.orders, orderId, {
        assignedPickerId: user.uid,
        assignedLeadId: user.uid,
      }),
    }));

    firestoreAssignSelfAsPicker(orderId, user).catch((e) =>
      console.error('[orders.store] assignSelfAsPicker Firestore error', e),
    );
  },

  approveAudit: (orderId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({ orders: patchOrder(s.orders, orderId, applyApproveAudit(order)) }));

    const user = useAuthStore.getState().user;
    if (user) {
      firestoreApproveAudit(orderId, user).catch((e) =>
        console.error('[orders.store] approveAudit Firestore error', e),
      );
      notifyAuditOutcome(order, user, 'approved');
    }
  },

  rejectAudit: (orderId, auditorId, auditorName, observation, rejectedBundles, approvedBundles) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(
        s.orders,
        orderId,
        applyRejectAudit(
          order,
          auditorId,
          auditorName,
          observation,
          rejectedBundles,
          approvedBundles,
        ),
      ),
    }));

    const user = useAuthStore.getState().user;
    if (user) {
      firestoreRejectAudit(orderId, user, observation, rejectedBundles, approvedBundles).catch(
        (e) => console.error('[orders.store] rejectAudit Firestore error', e),
      );
      notifyAuditOutcome(order, user, 'rejected', observation);
    }
  },

  pausePicking: (orderId, reason, missingSkus) => {
    const order = get().getOrderById(orderId);
    if (!order) return;

    const user = useAuthStore.getState().user;
    if (!user) return;

    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyPausePicking(order, user, reason, missingSkus)),
    }));

    // `order.status` es el estatus operativo (la pausa nunca lo cambia): se
    // envía para registrarlo en la nota de la entrada de timeline.
    firestorePausePicking(orderId, user, reason, missingSkus, order.status).catch((e) =>
      console.error('[orders.store] pausePicking Firestore error', e),
    );
  },

  resumePicking: (orderId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;

    set((s) => ({ orders: patchOrder(s.orders, orderId, applyResumePicking(order)) }));

    const user = useAuthStore.getState().user;
    if (user) {
      // Restaura el estatus operativo actual (que la app conserva en memoria).
      firestoreResumePicking(orderId, user, order.status).catch((e) =>
        console.error('[orders.store] resumePicking Firestore error', e),
      );
    }
  },

  openBulto: (orderId) => {
    const order = get().getOrderById(orderId);
    if (!order) return { ok: false, error: 'empty_open_bulto_exists' };

    const block = canOpenBulto(order);
    if (block) return { ok: false, error: block };

    const nextNumber = order.bultos.length + 1;
    const isExtra = nextNumber > order.definedBultos;
    const patch = applyOpenBulto(order);
    set((s) => ({ orders: patchOrder(s.orders, orderId, patch) }));
    return { ok: true, isExtra };
  },

  createQuickBundle: (orderId, lineId) => {
    const order = get().getOrderById(orderId);
    if (!order) return false;

    const patch = applyQuickBundle(order, lineId);
    if (!patch) return false;

    set((s) => ({ orders: patchOrder(s.orders, orderId, patch) }));

    // El bulto nace cerrado: si con eso se cruzó un hito, se persiste igual que
    // al cerrar uno a mano.
    const updatedOrder = { ...order, ...patch };
    if (updatedOrder.lastSavedMilestone > order.lastSavedMilestone) {
      firestorePartialSave(
        orderId,
        updatedOrder.progressPercentage,
        updatedOrder.bundlesCreated,
        updatedOrder.finalSkus,
      ).catch((e) => console.error('[orders.store] quickBundle partialSave error', e));
    }

    return true;
  },

  closeBulto: (orderId, bultoId) => {
    const order = get().getOrderById(orderId);
    if (!order) return { ok: false, error: 'cannot_close_empty_bulto' };

    const block = canCloseBulto(order, bultoId);
    if (block) return { ok: false, error: block };

    const patch = applyCloseBulto(order, bultoId);
    set((s) => ({ orders: patchOrder(s.orders, orderId, patch) }));

    // If a milestone was reached, persist to Firestore
    const updatedOrder = { ...order, ...patch };
    if (updatedOrder.lastSavedMilestone > order.lastSavedMilestone) {
      firestorePartialSave(
        orderId,
        updatedOrder.progressPercentage,
        updatedOrder.bundlesCreated,
        updatedOrder.finalSkus,
      ).catch((e) => console.error('[orders.store] partialSave Firestore error', e));
    }

    return { ok: true };
  },

  reopenBulto: (orderId, bultoId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;

    const user = useAuthStore.getState().user;

    /**
     * Reabrir un bulto de un pedido rechazado YA ES retomar la corrección: no
     * tiene sentido dejar el pedido en `rejected_review` y obligar al picker a
     * pulsar además "Reabrir picking". Se hace la misma transición que ese
     * botón (ver reopenForRevision), incluida la escritura a Firestore.
     */
    const resumesRevision = order.status === 'rejected_review' && user != null;

    const patch =
      resumesRevision && user
        ? { ...applyReopenBulto(order, bultoId), ...applyReopenForRevision(order, user.uid) }
        : applyReopenBulto(order, bultoId);

    set((s) => ({ orders: patchOrder(s.orders, orderId, patch) }));

    if (resumesRevision && user) {
      firestoreReopenForRevision(orderId, user).catch((e) =>
        console.error('[orders.store] reopenBulto → reopenForRevision Firestore error', e),
      );
    }
  },

  deleteBulto: (orderId, bultoId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyDeleteBulto(order, bultoId)),
    }));
  },

  addBultoItem: (orderId, bultoId, lineId, sku, name, qty, options) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(
        s.orders,
        orderId,
        applyAddBultoItem(order, bultoId, lineId, sku, name, qty, options),
      ),
    }));
  },

  updateBultoItem: (orderId, bultoId, itemId, qty) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyUpdateBultoItem(order, bultoId, itemId, qty)),
    }));
  },

  removeBultoItem: (orderId, bultoId, itemId) => {
    const order = get().getOrderById(orderId);
    if (!order) return { ok: true, bultoEmpty: false, bultoId, bultoNumber: 0 };

    const target = order.bultos.find((b) => b.id === bultoId);
    const patch = applyRemoveBultoItem(order, bultoId, itemId);
    set((s) => ({ orders: patchOrder(s.orders, orderId, patch) }));

    const updatedBulto = patch.bultos?.find((b) => b.id === bultoId);
    const bultoEmpty = Boolean(updatedBulto && updatedBulto.items.length === 0);

    return {
      ok: true,
      bultoEmpty,
      bultoId,
      bultoNumber: target?.number ?? 0,
    };
  },

  resetOrders: () => set({ orders: [], hydratedFromServer: false }),
}));
