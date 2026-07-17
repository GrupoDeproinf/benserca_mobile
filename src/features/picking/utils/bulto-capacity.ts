import type { Bulto, Order, OrderLine } from '../types';
import { getAssignedQtyForLine } from './order-snapshot';

/**
 * Ya no existe el concepto de "capacidad de bulto" (units_per_bundle).
 * El picker decide libremente cuántas unidades mete en cada bulto.
 * El único límite al agregar un SKU es la cantidad pendiente del pedido
 * (no se puede empaquetar más de lo pedido).
 */

export function getActiveOrderLines(order: Order): OrderLine[] {
  return order.snapshotOriginal ?? order.lines;
}

export type PendingAdd = {
  sku: string;
  qty: number;
  originalSku?: string;
};

/** Cantidad aún sin asignar a bultos para una línea del pedido. */
export function getPendingQtyForLine(order: Order, lineSku: string): number {
  const lines = getActiveOrderLines(order);
  const line = lines.find((l) => l.sku === lineSku);
  if (!line) return 0;
  return Math.max(0, line.requiredQty - getAssignedQtyForLine(order, lineSku));
}

/**
 * Máximo a agregar de un SKU: lo que quede pendiente del pedido para esa línea,
 * descontando lo que ya se esté agregando de la misma línea en el sheet.
 */
export function getMaxAddQtyForOrderLine(
  order: Order,
  _bulto: Bulto,
  lineSku: string,
  pending: PendingAdd[] = [],
  options?: { originalSku?: string },
): number {
  const lineKey = options?.originalSku ?? lineSku;
  const pendingQty = getPendingQtyForLine(order, lineKey);
  const alreadyInSheet = pending
    .filter((p) => (p.originalSku ?? p.sku) === lineKey)
    .reduce((sum, p) => sum + Math.max(0, p.qty), 0);
  return Math.max(0, pendingQty - alreadyInSheet);
}

/**
 * Máximo al que se puede subir un ítem ya dentro de un bulto (stepper),
 * sin superar la cantidad pedida de su línea (contando lo asignado en otros bultos).
 */
export function getMaxQtyForBultoItem(order: Order, itemId: string): number {
  let target: { sku: string; originalSku?: string; qty: number } | undefined;
  for (const bulto of order.bultos) {
    const found = bulto.items.find((i) => i.id === itemId);
    if (found) {
      target = found;
      break;
    }
  }
  if (!target) return 0;

  const lineKey = target.originalSku ?? target.sku;
  const line = getActiveOrderLines(order).find((l) => l.sku === lineKey);
  const required = line?.requiredQty ?? Number.POSITIVE_INFINITY;
  const assignedElsewhere = getAssignedQtyForLine(order, lineKey) - target.qty;
  return Math.max(0, required - assignedElsewhere);
}
