import type { Order } from '../types';

/** Orden de cola: en proceso primero, luego por queuePosition. */
export function sortPickerOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
    return a.queuePosition - b.queuePosition;
  });
}

export function canPickerStartOrder(
  order: Order,
  pickerOrders: Order[],
  hasActiveOrder: boolean,
): { ok: true } | { ok: false; error: 'not_queue_head' | 'already_active_order' } {
  if (hasActiveOrder) return { ok: false, error: 'already_active_order' };

  const sorted = sortPickerOrders(
    pickerOrders.filter((o) => o.status === 'assigned' || o.status === 'in_progress'),
  );
  const head = sorted[0];
  if (!head || head.id !== order.id) return { ok: false, error: 'not_queue_head' };

  return { ok: true };
}

export function isPickerQueueHead(order: Order, pickerOrders: Order[]): boolean {
  const sorted = sortPickerOrders(
    pickerOrders.filter((o) => o.status === 'assigned' || o.status === 'in_progress'),
  );
  return sorted[0]?.id === order.id;
}

/** Posición efectiva en la cola (1 = cabeza), según el orden actual. */
export function getEffectiveQueuePosition(order: Order, pickerOrders: Order[]): number | null {
  const sorted = sortPickerOrders(
    pickerOrders.filter((o) => o.status === 'assigned' || o.status === 'in_progress'),
  );
  const idx = sorted.findIndex((o) => o.id === order.id);
  if (idx < 0) return null;
  return idx + 1;
}
