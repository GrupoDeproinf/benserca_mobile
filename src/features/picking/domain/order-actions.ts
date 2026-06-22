/**
 * Acciones de dominio puro del picking.
 */
import { notify } from '@/features/notifications/store/notifications.store';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import type { AuditObservation, Bulto, BultoItem, Order, PickerActionError } from '../types';
import { buildPartialSavePatch } from '../utils/partial-save';
import {
  computeProgressPercentage,
  computeBundlesCreated,
} from '../utils/order-progress';
import {
  buildFinalSkus,
  closeOpenBultosWithItems,
  hasEmptyOpenBulto,
  renumberBultos,
} from '../utils/order-snapshot';

function syncPickingMetrics(order: Order, bultos: Bulto[]): Partial<Order> {
  const withBultos = { ...order, bultos };
  return {
    bultos,
    progressPercentage: computeProgressPercentage(withBultos),
    bundlesCreated: computeBundlesCreated(bultos),
    finalSkus: buildFinalSkus(withBultos, bultos),
  };
}

// ─── Picking lifecycle ────────────────────────────────────────────────────────

export function applyStartPicking(order: Order, pickerId: string): Partial<Order> {
  usePickersStore.getState().setPickerStatus(pickerId, 'en_proceso', order.id);
  return {
    status: 'in_progress',
    snapshotOriginal: structuredClone(order.lines),
    bultos: order.bultos.length > 0 ? order.bultos : [],
    finalSkus: [],
    progressPercentage: 0,
    bundlesCreated: 0,
    lastSavedMilestone: 0,
  };
}

export function applyFinishPicking(order: Order, pickerId: string): Partial<Order> {
  usePickersStore.getState().setPickerStatus(pickerId, 'disponible', null);

  const closedOpen = closeOpenBultosWithItems(order.bultos);
  const renumbered = renumberBultos(closedOpen);
  const withBultos = { ...order, bultos: renumbered };
  const finalSkus = buildFinalSkus(withBultos, renumbered);
  const progressPercentage = 100;
  const bundlesCreated = computeBundlesCreated(renumbered);

  notify({
    userId: 'broadcast-auditor',
    type: 'order_ready_to_audit',
    title: `${order.orderNumber} listo para auditar`,
    body: `El pedido ${order.orderNumber} (${order.client}) está empaquetado.`,
    orderId: order.id,
  });

  return {
    status: 'to_pack',
    bultos: renumbered,
    finalSkus,
    progressPercentage,
    bundlesCreated,
    lastSavedMilestone: 100,
    hasExtraBultos: bundlesCreated > order.definedBultos || order.hasExtraBultos,
  };
}

/** Marcar como embalado (desde Auditado o Empaquetado si omitieron auditoría). */
export function applyMarkWrapped(order: Order): Partial<Order> {
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

export function canOpenBulto(order: Order): PickerActionError | null {
  if (hasEmptyOpenBulto(order.bultos)) return 'empty_open_bulto_exists';
  return null;
}

export function canFinishPicking(order: Order): PickerActionError | null {
  if (hasEmptyOpenBulto(order.bultos)) return 'empty_open_bulto_exists';
  return null;
}

export function applyOpenBulto(order: Order): Partial<Order> {
  const nextNumber = order.bultos.length + 1;
  const newBulto: Bulto = {
    id: `bulto-${order.id}-${Date.now()}`,
    number: nextNumber,
    status: 'open',
    items: [],
  };
  const bultos = [...order.bultos, newBulto];
  const hasExtraBultos = nextNumber > order.definedBultos;

  return {
    ...syncPickingMetrics(order, bultos),
    hasExtraBultos: order.hasExtraBultos || hasExtraBultos,
  };
}

export function canCloseBulto(order: Order, bultoId: string): PickerActionError | null {
  const bulto = order.bultos.find((b) => b.id === bultoId);
  if (!bulto || bulto.items.length === 0) return 'cannot_close_empty_bulto';
  return null;
}

export function applyCloseBulto(order: Order, bultoId: string): Partial<Order> {
  const bultos = order.bultos.map((b) =>
    b.id === bultoId ? { ...b, status: 'closed' as const } : b,
  );
  const withBultos = { ...order, bultos };
  const progressPercentage = computeProgressPercentage(withBultos);
  const milestone = getMilestoneForProgress(progressPercentage, order.lastSavedMilestone);
  const base = syncPickingMetrics(order, bultos);

  if (milestone > order.lastSavedMilestone) {
    return {
      ...base,
      ...buildPartialSavePatch(withBultos, milestone),
    };
  }

  return base;
}

function getMilestoneForProgress(progress: number, lastSaved: number): number {
  const milestones = [25, 50, 75, 100];
  let result = lastSaved;
  for (const m of milestones) {
    if (progress >= m && lastSaved < m) result = m;
  }
  return result;
}

export function applyReopenBulto(order: Order, bultoId: string): Partial<Order> {
  const bultos = order.bultos.map((b) =>
    b.id === bultoId ? { ...b, status: 'open' as const } : b,
  );
  return syncPickingMetrics(order, bultos);
}

export function applyDeleteBulto(order: Order, bultoId: string): Partial<Order> {
  const filtered = order.bultos.filter((b) => b.id !== bultoId);
  const bultos = renumberBultos(filtered);
  return syncPickingMetrics(order, bultos);
}

export function applyAddBultoItem(
  order: Order,
  bultoId: string,
  sku: string,
  name: string,
  qty: number,
  options?: { originalSku?: string; substitutionNote?: string },
): Partial<Order> {
  const bultos = order.bultos.map((b) => {
    if (b.id !== bultoId) return b;

    const matchSku = options?.originalSku ?? sku;
    const existing = b.items.find(
      (i) => i.sku === sku && (i.originalSku ?? i.sku) === matchSku,
    );

    const items: BultoItem[] = existing
      ? b.items.map((i) =>
          i.id === existing.id
            ? {
                ...i,
                qty: i.qty + qty,
                substitutionNote: options?.substitutionNote ?? i.substitutionNote,
              }
            : i,
        )
      : [
          ...b.items,
          {
            id: `bi-${Date.now()}`,
            sku,
            name,
            qty,
            originalSku: options?.originalSku,
            substitutionNote: options?.substitutionNote,
          },
        ];

    return { ...b, items };
  });

  return syncPickingMetrics(order, bultos);
}

export function applyUpdateBultoItem(
  order: Order,
  bultoId: string,
  itemId: string,
  qty: number,
): Partial<Order> {
  const bultos = order.bultos.map((b) =>
    b.id !== bultoId
      ? b
      : { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, qty } : i)) },
  );
  return syncPickingMetrics(order, bultos);
}

export function applyRemoveBultoItem(
  order: Order,
  bultoId: string,
  itemId: string,
): Partial<Order> {
  const bultos = order.bultos.map((b) =>
    b.id !== bultoId ? b : { ...b, items: b.items.filter((i) => i.id !== itemId) },
  );
  return syncPickingMetrics(order, bultos);
}

/** @deprecated Usar applyMarkWrapped */
export const applyMarkPacked = applyMarkWrapped;
