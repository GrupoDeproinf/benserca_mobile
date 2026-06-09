import { create } from 'zustand';
import {
  applyAddBultoItem,
  applyApproveAudit,
  applyCloseBulto,
  applyFinishPicking,
  applyMarkPacked,
  applyOpenBulto,
  applyRejectAudit,
  applyRemoveBultoItem,
  applyReopenBulto,
  applyReopenForRevision,
  applyStartPicking,
  applyUpdateBultoItem,
} from '../domain/order-actions';
import { MOCK_ORDERS } from '../data/mock-orders';
import type { Order, OrderStatus } from '../types';

function cloneOrders(): Order[] {
  return structuredClone(MOCK_ORDERS);
}

function patchOrder(orders: Order[], id: string, patch: Partial<Order>): Order[] {
  return orders.map((o) => (o.id === id ? { ...o, ...patch } : o));
}

interface OrdersState {
  orders: Order[];
  // Selectores
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrdersByPicker: (pickerId: string) => Order[];
  hasActiveOrder: (pickerId: string) => boolean;
  // Acciones de ciclo de vida
  startPicking: (orderId: string, pickerId: string) => void;
  finishPicking: (orderId: string, pickerId: string) => void;
  markPacked: (orderId: string) => void;
  reopenForRevision: (orderId: string, pickerId: string) => void;
  // Acciones de equipos
  assignTeam: (orderId: string, teamId: string) => void;
  clearTeam: (orderId: string) => void;
  // Acciones de auditoría
  approveAudit: (orderId: string) => void;
  rejectAudit: (orderId: string, auditorId: string, auditorName: string, observation: string) => void;
  // Acciones de bultos
  openBulto: (orderId: string) => { isExtra: boolean };
  closeBulto: (orderId: string, bultoId: string) => void;
  reopenBulto: (orderId: string, bultoId: string) => void;
  addBultoItem: (orderId: string, bultoId: string, sku: string, name: string, qty: number) => void;
  updateBultoItem: (orderId: string, bultoId: string, itemId: string, qty: number) => void;
  removeBultoItem: (orderId: string, bultoId: string, itemId: string) => void;
  resetOrders: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: cloneOrders(),

  getOrderById: (id) => get().orders.find((o) => o.id === id),
  getOrdersByStatus: (status) => get().orders.filter((o) => o.status === status),
  getOrdersByPicker: (pickerId) =>
    get().orders.filter((o) => o.assignedPickerId === pickerId),
  hasActiveOrder: (pickerId) =>
    get().orders.some(
      (o) =>
        o.assignedPickerId === pickerId &&
        (o.status === 'in_progress'),
    ),

  startPicking: (orderId, pickerId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({ orders: patchOrder(s.orders, orderId, applyStartPicking(order, pickerId)) }));
  },

  finishPicking: (orderId, pickerId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({ orders: patchOrder(s.orders, orderId, applyFinishPicking(order, pickerId)) }));
  },

  markPacked: (orderId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({ orders: patchOrder(s.orders, orderId, applyMarkPacked(order)) }));
  },

  reopenForRevision: (orderId, pickerId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyReopenForRevision(order, pickerId)),
    }));
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
  },

  rejectAudit: (orderId, auditorId, auditorName, observation) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyRejectAudit(order, auditorId, auditorName, observation)),
    }));
  },

  openBulto: (orderId) => {
    const order = get().getOrderById(orderId);
    if (!order) return { isExtra: false };
    const nextNumber = order.bultos.length + 1;
    const isExtra = nextNumber > order.definedBultos;
    const patch = applyOpenBulto(order);
    set((s) => ({ orders: patchOrder(s.orders, orderId, patch) }));
    return { isExtra };
  },

  closeBulto: (orderId, bultoId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyCloseBulto(order, bultoId)),
    }));
  },

  reopenBulto: (orderId, bultoId) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyReopenBulto(order, bultoId)),
    }));
  },

  addBultoItem: (orderId, bultoId, sku, name, qty) => {
    const order = get().getOrderById(orderId);
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyAddBultoItem(order, bultoId, sku, name, qty)),
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
    if (!order) return;
    set((s) => ({
      orders: patchOrder(s.orders, orderId, applyRemoveBultoItem(order, bultoId, itemId)),
    }));
  },

  resetOrders: () => set({ orders: cloneOrders() }),
}));
