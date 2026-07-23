import type { Order } from '../types';

/**
 * Orden de cola: en proceso primero, luego por queuePosition. Un pedido
 * `in_progress` pausado no cuenta como "en proceso" para este orden: no debe
 * seguir ocupando la cabeza de la cola y bloqueando el arranque de otros
 * pedidos asignados al mismo picker.
 */
export function sortPickerOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const aActive = a.status === 'in_progress' && !a.isPaused;
    const bActive = b.status === 'in_progress' && !b.isPaused;
    if (aActive && !bActive) return -1;
    if (bActive && !aActive) return 1;
    return a.queuePosition - b.queuePosition;
  });
}

/**
 * La cola (`queuePosition`) solo define el orden de aparición en la lista;
 * nunca bloquea el inicio de un pedido. El único bloqueo real es tener otro
 * pedido en proceso sin pausar (un picker no puede picar 2 pedidos activos
 * a la vez).
 */
export function canPickerStartOrder(
  hasActiveOrder: boolean,
): { ok: true } | { ok: false; error: 'already_active_order' } {
  if (hasActiveOrder) return { ok: false, error: 'already_active_order' };
  return { ok: true };
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
