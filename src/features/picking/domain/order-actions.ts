/**
 * Acciones de dominio puro.
 * Cada función recibe el estado actual del pedido y devuelve los cambios a aplicar.
 * Los stores las invocan para mantener la lógica de negocio fuera de los componentes.
 */
import { notify } from '@/features/notifications/store/notifications.store';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import type { AuditObservation, Bulto, BultoItem, Order } from '../types';
import { buildFinalState } from '../utils/order-snapshot';

// ─── Picking lifecycle ────────────────────────────────────────────────────────

export function applyStartPicking(order: Order, pickerId: string): Partial<Order> {
  usePickersStore.getState().setPickerStatus(pickerId, 'en_proceso', order.id);
  return {
    status: 'in_progress',
    snapshotOriginal: structuredClone(order.lines),
    bultos: order.bultos.length > 0 ? order.bultos : [],
  };
}

export function applyFinishPicking(order: Order, pickerId: string): Partial<Order> {
  usePickersStore.getState().setPickerStatus(pickerId, 'disponible', null);
  return {
    status: 'to_pack',
    finalState: buildFinalState(order.bultos),
  };
}

export function applyMarkPacked(order: Order): Partial<Order> {
  notify({
    userId: 'broadcast-auditor',
    type: 'order_ready_to_audit',
    title: `${order.orderNumber} listo para auditar`,
    body: `El pedido ${order.orderNumber} (${order.client}) está empaquetado.`,
    orderId: order.id,
  });
  return {
    status: 'packed',
    packedAt: new Date().toISOString(),
  };
}

export function applyReopenForRevision(order: Order, pickerId: string): Partial<Order> {
  usePickersStore.getState().setPickerStatus(pickerId, 'en_proceso', order.id);
  return { status: 'in_progress' };
}

// ─── Auditoría ────────────────────────────────────────────────────────────────

export function applyApproveAudit(_order: Order): Partial<Order> {
  return { status: 'audited' };
}

export function applyRejectAudit(
  order: Order,
  auditorId: string,
  auditorName: string,
  observationText: string,
): Partial<Order> {
  const observation: AuditObservation = {
    id: `obs-${Date.now()}`,
    auditorId,
    auditorName,
    text: observationText.trim(),
    createdAt: new Date().toISOString(),
  };

  if (order.assignedPickerId) {
    notify({
      userId: order.assignedPickerId,
      type: 'order_rejected',
      title: `${order.orderNumber} rechazado`,
      body: `Observación: ${observationText.trim()}`,
      orderId: order.id,
    });
  }

  return {
    status: 'rejected_review',
    auditObservations: [...order.auditObservations, observation],
  };
}

// ─── Bultos ──────────────────────────────────────────────────────────────────

export function applyOpenBulto(order: Order): { bultos: Bulto[]; hasExtraBultos: boolean } {
  const nextNumber = order.bultos.length + 1;
  const newBulto: Bulto = {
    id: `bulto-${order.id}-${Date.now()}`,
    number: nextNumber,
    status: 'open',
    items: [],
  };
  const hasExtraBultos = nextNumber > order.definedBultos;
  return {
    bultos: [...order.bultos, newBulto],
    hasExtraBultos: order.hasExtraBultos || hasExtraBultos,
  };
}

export function applyCloseBulto(order: Order, bultoId: string): { bultos: Bulto[] } {
  return {
    bultos: order.bultos.map((b) => (b.id === bultoId ? { ...b, status: 'closed' } : b)),
  };
}

export function applyReopenBulto(order: Order, bultoId: string): { bultos: Bulto[] } {
  return {
    bultos: order.bultos.map((b) => (b.id === bultoId ? { ...b, status: 'open' } : b)),
  };
}

export function applyAddBultoItem(
  order: Order,
  bultoId: string,
  sku: string,
  name: string,
  qty: number,
): { bultos: Bulto[] } {
  return {
    bultos: order.bultos.map((b) => {
      if (b.id !== bultoId) return b;
      const existing = b.items.find((i) => i.sku === sku);
      const items: BultoItem[] = existing
        ? b.items.map((i) => (i.sku === sku ? { ...i, qty: i.qty + qty } : i))
        : [...b.items, { id: `bi-${Date.now()}`, sku, name, qty }];
      return { ...b, items };
    }),
  };
}

export function applyUpdateBultoItem(
  order: Order,
  bultoId: string,
  itemId: string,
  qty: number,
): { bultos: Bulto[] } {
  return {
    bultos: order.bultos.map((b) =>
      b.id !== bultoId
        ? b
        : { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, qty } : i)) },
    ),
  };
}

export function applyRemoveBultoItem(
  order: Order,
  bultoId: string,
  itemId: string,
): { bultos: Bulto[] } {
  return {
    bultos: order.bultos.map((b) =>
      b.id !== bultoId ? b : { ...b, items: b.items.filter((i) => i.id !== itemId) },
    ),
  };
}
