import type { Bulto } from '@/features/picking/types';

export type AuditBultoEntry =
  | { kind: 'group'; key: string; sku: string; name: string; bultos: Bulto[] }
  | { kind: 'bulto'; key: string; bulto: Bulto; mixed: boolean };

/**
 * SKU del bulto si todo lo que lleva es el mismo artículo. Cuenta por SKU y no
 * por renglón: el "20 + 2" del mismo artículo en un bulto sigue siendo una sola
 * cosa para quien revisa la caja.
 */
export function getSingleArticleSku(bulto: Bulto): string | null {
  const first = bulto.items[0]?.sku;
  if (!first) return null;
  return bulto.items.every((item) => item.sku === first) ? first : null;
}

/**
 * Bultos de un solo artículo agrupados por SKU (cuando hay 2 o más iguales) y el
 * resto suelto, en el orden en que aparece el primer bulto de cada entrada.
 */
export function buildAuditBultoEntries(bultos: Bulto[]): AuditBultoEntry[] {
  const bySku = new Map<string, Bulto[]>();
  for (const bulto of bultos) {
    const sku = getSingleArticleSku(bulto);
    if (!sku) continue;
    const list = bySku.get(sku);
    if (list) list.push(bulto);
    else bySku.set(sku, [bulto]);
  }

  const entries: AuditBultoEntry[] = [];
  const emittedGroups = new Set<string>();

  for (const bulto of bultos) {
    const sku = getSingleArticleSku(bulto);
    const group = sku ? bySku.get(sku) : undefined;

    if (sku && group && group.length > 1) {
      if (emittedGroups.has(sku)) continue;
      emittedGroups.add(sku);
      entries.push({
        kind: 'group',
        key: `group:${sku}`,
        sku,
        name: bulto.items[0].name,
        bultos: group,
      });
      continue;
    }

    entries.push({
      kind: 'bulto',
      key: bulto.id,
      bulto,
      mixed: sku === null && bulto.items.length > 0,
    });
  }

  return entries;
}
