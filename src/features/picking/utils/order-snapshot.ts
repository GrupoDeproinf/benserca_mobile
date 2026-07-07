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

export function getLineUnitsPerBundle(lines: OrderLine[], sku: string): number {
  const value = lines.find((l) => l.sku === sku)?.unitsPerBundle ?? 0;
  return value > 0 ? value : 0;
}

/** Resuelve unidades por bulto de un ítem (incluye sustituciones). */
export function resolveItemUnitsPerBundle(item: BultoItem, lines: OrderLine[]): number {
  if (item.unitsPerBundle != null && item.unitsPerBundle > 0) return item.unitsPerBundle;

  const isSubstitution = Boolean(item.originalSku && item.originalSku !== item.sku);
  if (isSubstitution) {
    const fromPackedSku = getLineUnitsPerBundle(lines, item.sku);
    return fromPackedSku > 0 ? fromPackedSku : 1;
  }

  const key = item.originalSku ?? item.sku;
  return getLineUnitsPerBundle(lines, key) || getLineUnitsPerBundle(lines, item.sku) || 1;
}

export function computeBultoFraction(bulto: Bulto, lines: OrderLine[]): number {
  return bulto.items.reduce(
    (sum, item) => sum + computeBundleFraction(item.qty, resolveItemUnitsPerBundle(item, lines)),
    0,
  );
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

/** Reconstruye bultos cerrados desde final_skus de Firestore (solo lectura post-picking). */
export function reconstructBultosFromFinalSkus(
  orderId: string,
  finalSkus: FinalSku[],
  lines: OrderLine[],
): Bulto[] {
  const itemsByBundle = new Map<number, BultoItem[]>();

  const lineBySku = new Map(lines.map((line) => [line.sku, line]));

  const resolveItemName = (finalSku: FinalSku): string => {
    const packedLine = lineBySku.get(finalSku.packedSku);
    if (packedLine) return packedLine.name;
    const originalLine = lineBySku.get(finalSku.originalSku);
    return originalLine?.name ?? finalSku.packedSku;
  };

  const resolveUnitsPerBundle = (finalSku: FinalSku): number | undefined => {
    const packed = lineBySku.get(finalSku.packedSku)?.unitsPerBundle ?? 0;
    if (packed > 0) return packed;
    const original = lineBySku.get(finalSku.originalSku)?.unitsPerBundle ?? 0;
    return original > 0 ? original : undefined;
  };

  for (const finalSku of finalSkus) {
    const substituted =
      finalSku.substituted && finalSku.packedSku !== finalSku.originalSku;
    const unitsPerBundle = resolveUnitsPerBundle(finalSku);

    for (const bundle of finalSku.bundles) {
      if (!itemsByBundle.has(bundle.bundleNum)) {
        itemsByBundle.set(bundle.bundleNum, []);
      }

      const item: BultoItem = {
        id: `${orderId}-b${bundle.bundleNum}-${finalSku.originalSku}-${finalSku.packedSku}`,
        sku: finalSku.packedSku,
        name: resolveItemName(finalSku),
        qty: bundle.quantity,
        ...(substituted
          ? {
              originalSku: finalSku.originalSku,
              substitutionNote: finalSku.substitutionNote ?? undefined,
            }
          : {}),
        ...(unitsPerBundle != null ? { unitsPerBundle } : {}),
      };

      itemsByBundle.get(bundle.bundleNum)!.push(item);
    }
  }

  return [...itemsByBundle.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, items]) => ({
      id: `bulto-${orderId}-${number}`,
      number,
      status: 'closed' as const,
      items,
    }));
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
