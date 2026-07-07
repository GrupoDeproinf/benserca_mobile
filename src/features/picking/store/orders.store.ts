import { create } from 'zustand';
import {
  applyAddBultoItem,
  applyApproveAudit,
  applyCloseBulto,
  applyDeleteBulto,
  applyFinishPicking,
  applyMarkWrapped,
  applyOpenBulto,
  applyRejectAudit,
  applyRemoveBultoItem,
  applyReopenBulto,
  applyReopenForRevision,
  applyStartPicking,
  applyUpdateBultoItem,
  canCloseBulto,
  canFinishPicking,
  canOpenBulto,
} from '../domain/order-actions';
import {
  firestoreApproveAudit,
  firestoreFinishPicking,
  firestoreMarkWrapped,
  firestorePartialSave,
  firestoreRejectAudit,
  firestoreReopenForRevision,
  firestoreStartPicking,
} from '../services/orders.service';
import type { Order, OrderStatus, PickerActionError } from '../types';
import { canPickerStartOrder } from '../utils/picker-queue';
import { useAuthStore } from '@/features/auth/store/auth.store';

function patchOrder(orders: Order[], id: string, patch: Partial<Order>): Order[] {
  return orders.map((o) => (o.id === id ? { ...o, ...patch } : o));
}

type OpenBultoResult = { ok: true; isExtra: boolean } | { ok: false; error: PickerActionError };
type StartPickingResult = { ok: true } | { ok: false; error: 'not_queue_head' | 'already_active_order' };
type CloseBultoResult = { ok: true } | { ok: false; error: PickerActionError };
type FinishPickingResult = { ok: true } | { ok: false; error: PickerActionError };
type RemoveItemResult = { ok: true; bultoEmpty: boolean; bultoId: string; bultoNumber: number };

interface OrdersState {
  orders: Order[];
  /** Hidrata el store con pedidos desde Firestore, preservando estado local de bultos si el pedido está en progreso. */
  hydrateOrders: (incoming: Order[]) => void;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrdersByPicker: (pickerId: string) => Order[];
  hasActiveOrder: (pickerId: string) => boolean;
  startPicking: (orderId: string, pickerId: string) => StartPickingResult;
  finishPicking: (orderId: string, pickerId: string) => FinishPickingResult;
  markWrapped: (orderId: string) => void;
  reopenForRevision: (orderId: string, pickerId: string) => void;
  assignTeam: (orderId: string, teamId: string) => void;
  clearTeam: (orderId: string) => void;
  approveAudit: (orderId: string) => void;
  rejectAudit: (orderId: string, auditorId: string, auditorName: string, observation: string) => void;
  openBulto: (orderId: string) => OpenBultoResult;
  closeBulto: (orderId: string, bultoId: string) => CloseBultoResult;
  reopenBulto: (orderId: string, bultoId: string) => void;
  deleteBulto: (orderId: string, bultoId: string) => void;
  addBultoItem: (
    orderId: string,
    bultoId: string,
    sku: string,
    name: string,
    qty: number,
    options?: { originalSku?: string; substitutionNote?: string; unitsPerBundle?: number },
  ) => void;
  updateBultoItem: (orderId: string, bultoId: string, itemId: string, qty: number) => void;
  removeBultoItem: (orderId: string, bultoId: string, itemId: string) => RemoveItemResult;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],

  hydrateOrders: (incoming) => {
    set((s) => {
      const localMap = new Map(s.orders.map((o) => [o.id, o]));
      const merged = incoming.map((firestoreOrder) => {
        const local = localMap.get(firestoreOrder.id);
        if (!local) return firestoreOrder;

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
              local.progressPercentage > 0
                ? local.progressPercentage
                : firestoreOrder.progressPercentage,
            bundlesCreated:
              local.bundlesCreated > 0 ? local.bundlesCreated : firestoreOrder.bundlesCreated,
            hasExtraBultos: local.hasExtraBultos || firestoreOrder.hasExtraBultos,
            snapshotOriginal: local.snapshotOriginal ?? firestoreOrder.snapshotOriginal,
          };
        }

        return firestoreOrder;
      });
      return { orders: merged };
    });
  },

  getOrderById: (id) => get().orders.find((o) => o.id === id),
  getOrdersByStatus: (status) => get().orders.filter((o) => o.status === status),
  getOrdersByPicker: (pickerId) => get().orders.filter((o) => o.assignedPickerId === pickerId),
  hasActiveOrder: (pickerId) =>
    get().orders.some((o) => o.assignedPickerId === pickerId && o.status === 'in_progress'),

  startPicking: (orderId, pickerId) => {
    const order = get().getOrderById(orderId);
    if (!order) return { ok: false, error: 'not_queue_head' };

    const pickerOrders = get().getOrdersByPicker(pickerId);
    const check = canPickerStartOrder(order, pickerOrders, get().hasActiveOrder(pickerId));
    if (!check.ok) return check;

    const patch = applyStartPicking(order, pickerId);
    set((s) => ({ orders: patchOrder(s.orders, orderId, patch) }));

    const user = useAuthStore.getState().user;
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

  assignTeam: (orderId, teamId) => {
    set((s) => ({
      orders: patchOrder(s.orders, orderId, { teamId, status: 'in_progress' }),
    }));
  },

  clearTeam: (orderId) => {
    set((s) => ({
      orders: patchOrder(s.orders, orderId, { teamId: null, status: 'assigned' }),
    }));
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
    }
  },

  rejectAudit: (orderId, auditorId, auditorName, observation) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyRejectAudit(order, auditorId, auditorName, observation)),
    }));

    const user = useAuthStore.getState().user;
    if (user) {
      firestoreRejectAudit(orderId, user, observation).catch((e) =>
        console.error('[orders.store] rejectAudit Firestore error', e),
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
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyReopenBulto(order, bultoId)),
    }));
  },

  deleteBulto: (orderId, bultoId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyDeleteBulto(order, bultoId)),
    }));
  },

  addBultoItem: (orderId, bultoId, sku, name, qty, options) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyAddBultoItem(order, bultoId, sku, name, qty, options)),
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
}));
