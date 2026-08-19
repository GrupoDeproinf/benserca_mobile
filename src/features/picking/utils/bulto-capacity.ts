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
  /** Renglón al que se le está sumando en el sheet (`OrderLine.id`). */
  lineId: string;
  qty: number;
};

/** Cantidad aún sin asignar a bultos para un RENGLÓN del pedido. */
export function getPendingQtyForLine(order: Order, lineId: string): number {
  const line = getActiveOrderLines(order).find((l) => l.id === lineId);
  if (!line) return 0;
  return Math.max(0, line.requiredQty - getAssignedQtyForLine(order, lineId));
}

/**
 * Máximo a agregar de un renglón: lo que le quede pendiente, descontando lo que
 * ya se esté agregando de ese MISMO renglón en el sheet.
 *
 * Va por renglón y no por SKU: con "19 + 1" del mismo artículo, completar el
 * renglón de 19 no debe dejar en cero el pendiente del de 1 (que es justo lo
 * que impedía meter la última unidad).
 */
export function getMaxAddQtyForOrderLine(
  order: Order,
  _bulto: Bulto,
  lineId: string,
  pending: PendingAdd[] = [],
): number {
  const pendingQty = getPendingQtyForLine(order, lineId);
  const alreadyInSheet = pending
    .filter((p) => p.lineId === lineId)
    .reduce((sum, p) => sum + Math.max(0, p.qty), 0);
  return Math.max(0, pendingQty - alreadyInSheet);
}

/**
 * Máximo al que se puede subir un ítem ya dentro de un bulto (stepper),
 * sin superar la cantidad pedida de su línea (contando lo asignado en otros bultos).
 */
export function getMaxQtyForBultoItem(order: Order, itemId: string): number {
  let target: { lineId: string; qty: number } | undefined;
  for (const bulto of order.bultos) {
    const found = bulto.items.find((i) => i.id === itemId);
    if (found) {
      target = found;
      break;
    }
  }
  if (!target) return 0;

  const line = getActiveOrderLines(order).find((l) => l.id === target.lineId);
  const required = line?.requiredQty ?? Number.POSITIVE_INFINITY;
  const assignedElsewhere = getAssignedQtyForLine(order, target.lineId) - target.qty;
  return Math.max(0, required - assignedElsewhere);
}
