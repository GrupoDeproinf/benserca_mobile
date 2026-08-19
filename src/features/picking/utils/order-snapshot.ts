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

/**
 * Identidad de un renglón del pedido. Ver `OrderLine.id`: Profit no manda
 * ningún id, así que se usa la posición dentro de `original_skus`.
 */
export function makeLineId(sku: string, index: number): string {
  return `${sku}#${index}`;
}

/** Cuánto se ha metido en bultos para un RENGLÓN concreto. */
export function getAssignedQtyForLine(order: Order, lineId: string): number {
  return order.bultos.reduce((sum, bulto) => {
    const inBulto = bulto.items.filter((i) => i.lineId === lineId).reduce((s, i) => s + i.qty, 0);
    return sum + inBulto;
  }, 0);
}

export interface MissingLineQty {
  lineId: string;
  sku: string;
  name: string;
  /** Cuánto falta por meter en bultos (`required - packed`), siempre > 0. */
  missing: number;
  /** Cantidad pedida en ESE renglón. */
  required: number;
  /** Cuánto hay ya repartido entre los bultos (abiertos y cerrados). */
  packed: number;
}

/**
 * Renglones que aún no están completos en los bultos: los que no se metieron en
 * ninguno y los que van a medias (pedidos 20, armados 3 → faltan 17).
 *
 * Un renglón por fila, sin agrupar por SKU: si Profit mandó el mismo artículo
 * dos veces (19 + 1), son dos pendientes distintos y el picker los completa por
 * separado.
 */
export function getMissingQuantities(order: Order): MissingLineQty[] {
  const rows: MissingLineQty[] = [];

  for (const line of order.lines) {
    const packed = getAssignedQtyForLine(order, line.id);
    const missing = line.requiredQty - packed;
    if (missing > 0) {
      rows.push({
        lineId: line.id,
        sku: line.sku,
        name: line.name,
        missing,
        required: line.requiredQty,
        packed,
      });
    }
  }

  return rows;
}

export function resolveOriginalSku(item: BultoItem): string {
  return item.originalSku ?? item.sku;
}

/**
 * Repara bultos guardados por una versión anterior de la app, cuyos ítems no
 * tienen `lineId` (antes todo se emparejaba por SKU).
 *
 * Sin esto, el picking que el picker tenga sin guardar al actualizar la app se
 * vería como "nada armado": ninguna cantidad quedaría atribuida a su renglón.
 * Se resuelve por SKU, que es exactamente lo que hacía la versión que guardó
 * esos datos, consumiendo cada renglón una sola vez para repartir los repetidos.
 */
export function ensureItemLineIds(bultos: Bulto[], lines: OrderLine[]): Bulto[] {
  if (bultos.every((b) => b.items.every((i) => i.lineId))) return bultos;

  const consumed = new Set<string>();

  return bultos.map((bulto) => ({
    ...bulto,
    items: bulto.items.map((item) => {
      if (item.lineId) return item;

      const sku = resolveOriginalSku(item);
      const line = lines.find((l) => l.sku === sku && !consumed.has(l.id));
      if (line) consumed.add(line.id);

      return { ...item, lineId: line?.id ?? makeLineId(sku, 0) };
    }),
  }));
}

export function isItemSubstituted(item: BultoItem): boolean {
  return Boolean(item.originalSku && item.originalSku !== item.sku);
}

/**
 * Construye final_skus desde bultos (opcionalmente solo cerrados).
 *
 * Un registro por RENGLÓN, en el mismo orden que `original_skus`, y los ítems se
 * emparejan por `lineId`. Antes se emparejaban por SKU, así que dos renglones
 * repetidos recibían los mismos bultos y lo armado se reportaba dos veces.
 */
export function buildFinalSkus(order: Order, bultos: Bulto[]): FinalSku[] {
  const sourceLines = order.snapshotOriginal ?? order.lines;

  return sourceLines.map((line, index) => {
    const bundles: FinalSku['bundles'] = [];
    let packedSku = line.sku;
    let substitutionNote: string | null = null;
    let substituted = false;

    for (const bulto of bultos) {
      for (const item of bulto.items) {
        if (item.lineId !== line.id) continue;

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
      lineIndex: index,
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

/**
 * A qué renglón pertenece cada registro de `final_skus`.
 *
 * Se confía en `line_index`, pero solo si el SKU de ese renglón coincide: si la
 * web reimportó el pedido y reordenó `original_skus`, el índice apuntaría a otro
 * artículo y el trabajo quedaría atribuido al renglón equivocado. Cuando no
 * cuadra se cae a emparejar por SKU (el comportamiento anterior), consumiendo
 * cada renglón una sola vez para que dos registros repetidos no caigan los dos
 * sobre el mismo.
 */
function resolveLinesForFinalSkus(
  finalSkus: FinalSku[],
  lines: OrderLine[],
): (OrderLine | undefined)[] {
  const consumed = new Set<string>();
  const resolved: (OrderLine | undefined)[] = [];

  for (const finalSku of finalSkus) {
    const byIndex = lines[finalSku.lineIndex];
    if (byIndex && byIndex.sku === finalSku.originalSku && !consumed.has(byIndex.id)) {
      consumed.add(byIndex.id);
      resolved.push(byIndex);
      continue;
    }

    const bySku = lines.find((l) => l.sku === finalSku.originalSku && !consumed.has(l.id));
    if (bySku) consumed.add(bySku.id);
    resolved.push(bySku);
  }

  return resolved;
}

/** Reconstruye bultos cerrados desde final_skus de Firestore (solo lectura post-picking). */
export function reconstructBultosFromFinalSkus(
  orderId: string,
  finalSkus: FinalSku[],
  lines: OrderLine[],
): Bulto[] {
  const itemsByBundle = new Map<number, BultoItem[]>();

  const lineBySku = new Map(lines.map((line) => [line.sku, line]));
  const lineForFinalSku = resolveLinesForFinalSkus(finalSkus, lines);

  const resolveItemName = (finalSku: FinalSku): string => {
    const packedLine = lineBySku.get(finalSku.packedSku);
    if (packedLine) return packedLine.name;
    const originalLine = lineBySku.get(finalSku.originalSku);
    return originalLine?.name ?? finalSku.packedSku;
  };

  for (const [idx, finalSku] of finalSkus.entries()) {
    const substituted = finalSku.substituted && finalSku.packedSku !== finalSku.originalSku;
    const lineId = lineForFinalSku[idx]?.id ?? makeLineId(finalSku.originalSku, finalSku.lineIndex);

    for (const bundle of finalSku.bundles) {
      if (!itemsByBundle.has(bundle.bundleNum)) {
        itemsByBundle.set(bundle.bundleNum, []);
      }

      const item: BultoItem = {
        // El renglón entra en el id: dos renglones del mismo SKU pueden estar en
        // el mismo bulto y necesitan ítems distintos.
        id: `${orderId}-b${bundle.bundleNum}-${lineId}-${finalSku.packedSku}`,
        lineId,
        sku: finalSku.packedSku,
        name: resolveItemName(finalSku),
        qty: bundle.quantity,
        ...(substituted
          ? {
              originalSku: finalSku.originalSku,
              substitutionNote: finalSku.substitutionNote ?? undefined,
            }
          : {}),
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
