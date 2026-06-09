import type { Bulto, BultoItem } from '../types';

/** Agrega ítems de todos los bultos por SKU (estado final para auditoría). */
export function buildFinalState(bultos: Bulto[]): BultoItem[] {
  const bySku = new Map<string, BultoItem>();

  for (const bulto of bultos) {
    for (const item of bulto.items) {
      const existing = bySku.get(item.sku);
      if (existing) {
        existing.qty += item.qty;
      } else {
        bySku.set(item.sku, { ...item, id: item.sku });
      }
    }
  }

  return [...bySku.values()];
}
