import type { Bulto, BultoItem, Order, OrderLine } from '../types';
import {
  computeBultoFraction,
  computeBundleFraction,
  getLineUnitsPerBundle,
} from './order-snapshot';

/** Capacidad total de un bulto (fracción). */
const CAPACITY_LIMIT = 1;
const EPS = 1e-6;

export function getActiveOrderLines(order: Order): OrderLine[] {
  return order.snapshotOriginal ?? order.lines;
}

/**
 * Fracción que aporta un ítem: cantidad / unidades_por_bulto.
 * Ej: TV con 2 por bulto → cada TV = 0.5. Soporte con 4 por bulto → cada uno = 0.25.
 */
export function getItemFractionContribution(item: BultoItem, lines: OrderLine[]): number {
  const originalSku = item.originalSku ?? item.sku;
  const units =
    getLineUnitsPerBundle(lines, originalSku) ||
    getLineUnitsPerBundle(lines, item.sku) ||
    1;
  return computeBundleFraction(item.qty, units);
}

export function getBultoRemainingFraction(bulto: Bulto, lines: OrderLine[]): number {
  return Math.max(0, CAPACITY_LIMIT - computeBultoFraction(bulto, lines));
}

export function isBultoFull(bulto: Bulto, lines: OrderLine[]): boolean {
  return computeBultoFraction(bulto, lines) >= CAPACITY_LIMIT - EPS;
}

/** Cuántas unidades de este SKU llenan 1.0 de fracción en el bulto. */
export function getUnitsPerBundleForItem(
  lines: OrderLine[],
  sku: string,
  originalSku?: string,
): number {
  const key = originalSku ?? sku;
  const fromLine = getLineUnitsPerBundle(lines, key);
  if (fromLine > 0) return fromLine;
  const fromSku = getLineUnitsPerBundle(lines, sku);
  return fromSku > 0 ? fromSku : 1;
}

export type PendingAdd = { sku: string; qty: number; originalSku?: string };

function maxQtyFromRemainingFraction(remainingFraction: number, unitsPerBundle: number): number {
  if (remainingFraction <= EPS) return 0;
  return Math.max(0, Math.floor(remainingFraction * unitsPerBundle + EPS));
}

function getExistingQtyInBulto(bulto: Bulto, sku: string, lineKey: string): number {
  return bulto.items
    .filter((i) => i.sku === sku && (i.originalSku ?? i.sku) === lineKey)
    .reduce((sum, i) => sum + i.qty, 0);
}

/** Fracción usada en ESTE bulto por otros ítems (y cantidades pendientes en el sheet). */
function getOtherFractionInBulto(
  bulto: Bulto,
  lines: OrderLine[],
  sku: string,
  lineKey: string,
  pending: PendingAdd[] = [],
  excludePending?: { sku: string; originalSku?: string },
): number {
  let other = 0;

  for (const item of bulto.items) {
    const itemKey = item.originalSku ?? item.sku;
    if (item.sku === sku && itemKey === lineKey) continue;
    other += getItemFractionContribution(item, lines);
  }

  for (const p of pending) {
    const pKey = p.originalSku ?? p.sku;
    if (
      excludePending &&
      p.sku === excludePending.sku &&
      pKey === (excludePending.originalSku ?? excludePending.sku)
    ) {
      continue;
    }
    if (p.qty <= 0) continue;
    other += computeBundleFraction(
      p.qty,
      getUnitsPerBundleForItem(lines, p.sku, p.originalSku),
    );
  }

  return other;
}

/**
 * Máximo a agregar de un SKU en ESTE bulto (solo capacidad 1.0, sin mirar otros bultos).
 */
export function getMaxAddQtyForSku(
  bulto: Bulto,
  lines: OrderLine[],
  sku: string,
  pending: PendingAdd[] = [],
  originalSku?: string,
): number {
  const units = getUnitsPerBundleForItem(lines, sku, originalSku);
  const lineKey = originalSku ?? sku;

  const existingInBulto = getExistingQtyInBulto(bulto, sku, lineKey);
  const otherFraction = getOtherFractionInBulto(
    bulto,
    lines,
    sku,
    lineKey,
    pending,
    { sku, originalSku },
  );

  const remainingFraction = Math.max(0, CAPACITY_LIMIT - otherFraction);
  const maxTotalInBulto = maxQtyFromRemainingFraction(remainingFraction, units);
  return Math.max(0, maxTotalInBulto - existingInBulto);
}

/** Máximo total de un ítem ya en ESTE bulto (al editar con stepper). */
export function getMaxQtyForBultoItem(
  bulto: Bulto,
  lines: OrderLine[],
  itemId: string,
): number {
  const item = bulto.items.find((i) => i.id === itemId);
  if (!item) return 0;

  const units = getUnitsPerBundleForItem(lines, item.sku, item.originalSku);
  const lineKey = item.originalSku ?? item.sku;

  const otherFraction = getOtherFractionInBulto(bulto, lines, item.sku, lineKey);
  const remainingFraction = Math.max(0, CAPACITY_LIMIT - otherFraction);
  return maxQtyFromRemainingFraction(remainingFraction, units);
}

export function getBultoCapacityPct(bulto: Bulto, lines: OrderLine[]): number {
  return Math.min(100, Math.round(computeBultoFraction(bulto, lines) * 100));
}
