import type { Bulto, BultoItem, FinalSku, Order, OrderLine } from '../types';

export function countClosedBultosWithItems(bultos: Bulto[]): number {
  return bultos.filter((b) => b.status === 'closed' && b.items.length > 0).length;
}

export function hasEmptyOpenBulto(bultos: Bulto[]): boolean {
  return bultos.some((b) => b.status === 'open' && b.items.length === 0);
}

export function renumberBultos(bultos: Bulto[]): Bulto[] {
  return bultos.map((b, idx) => ({ ...b, number: idx + 1 }));
}

export function closeOpenBultosWithItems(bultos: Bulto[]): Bulto[] {
  return bultos.map((b) =>
    b.status === 'open' && b.items.length > 0 ? { ...b, status: 'closed' as const } : b,
  );
}

export function computeBundleFraction(
  qty: number,
  unitsPerBundle: number,
): number {
  if (unitsPerBundle <= 0) return 0;
  return qty / unitsPerBundle;
}

export function computeBultoFraction(bulto: Bulto, lines: OrderLine[]): number {
  const unitsBySku = new Map(lines.map((l) => [l.sku, l.unitsPerBundle]));
  return bulto.items.reduce((sum, item) => {
    const originalSku = item.originalSku ?? item.sku;
    const units = unitsBySku.get(originalSku) ?? unitsBySku.get(item.sku) ?? 1;
    return sum + computeBundleFraction(item.qty, units);
  }, 0);
}

export function getLineUnitsPerBundle(lines: OrderLine[], sku: string): number {
  return lines.find((l) => l.sku === sku)?.unitsPerBundle ?? 1;
}

export function getAssignedQtyForLine(order: Order, lineSku: string): number {
  return order.bultos.reduce((sum, bulto) => {
    const inBulto = bulto.items
      .filter((i) => (i.originalSku ?? i.sku) === lineSku)
      .reduce((s, i) => s + i.qty, 0);
    return sum + inBulto;
  }, 0);
}

export interface MissingLineQty {
  sku: string;
  name: string;
  missing: number;
}

export function getMissingQuantities(order: Order): MissingLineQty[] {
  return order.lines
    .map((line) => ({
      sku: line.sku,
      name: line.name,
      missing: line.requiredQty - getAssignedQtyForLine(order, line.sku),
    }))
    .filter((row) => row.missing > 0);
}

export function resolveOriginalSku(item: BultoItem): string {
  return item.originalSku ?? item.sku;
}

export function isItemSubstituted(item: BultoItem): boolean {
  return Boolean(item.originalSku && item.originalSku !== item.sku);
}

/** Construye final_skus desde bultos (opcionalmente solo cerrados). */
export function buildFinalSkus(
  order: Order,
  bultos: Bulto[],
): FinalSku[] {
  const sourceLines = order.snapshotOriginal ?? order.lines;

  return sourceLines.map((line) => {
    const bundles: FinalSku['bundles'] = [];
    let packedSku = line.sku;
    let substitutionNote: string | null = null;
    let substituted = false;

    for (const bulto of bultos) {
      for (const item of bulto.items) {
        const originalSku = resolveOriginalSku(item);
        if (originalSku !== line.sku) continue;

        bundles.push({ bundleNum: bulto.number, quantity: item.qty });
        packedSku = item.sku;

        if (isItemSubstituted(item)) {
          substituted = true;
          substitutionNote = item.substitutionNote ?? substitutionNote;
        }
      }
    }

    const packedQuantity = bundles.reduce((sum, b) => sum + b.quantity, 0);
    const difference = substituted
      ? line.requiredQty
      : Math.max(0, line.requiredQty - packedQuantity);

    return {
      originalSku: line.sku,
      originalQuantity: line.requiredQty,
      packedSku,
      packedQuantity,
      difference,
      substituted,
      substitutionNote,
      bundles,
    };
  });
}

/** @deprecated Usar buildFinalSkus. Mantenido para compatibilidad de auditoría. */
export function buildFinalState(bultos: Bulto[]): BultoItem[] {
  const bySku = new Map<string, BultoItem>();

  for (const bulto of bultos) {
    for (const item of bulto.items) {
      const key = resolveOriginalSku(item);
      const existing = bySku.get(key);
      if (existing) {
        existing.qty += item.qty;
      } else {
        bySku.set(key, { ...item, id: key, sku: key });
      }
    }
  }

  return [...bySku.values()];
}
