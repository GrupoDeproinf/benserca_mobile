import type { Bulto, OrderLine } from '@/features/picking/types';

export type AuditComparisonStatus = 'ok' | 'over' | 'under';

export interface AuditComparisonRow {
  /** Renglón comparado (`OrderLine.id`). Vacío en lo armado que no pedía el pedido. */
  lineId: string;
  sku: string;
  name: string;
  required: number;
  picked: number;
  diff: number;
  status: AuditComparisonStatus;
}

/**
 * Lo armado, agrupado por RENGLÓN del pedido.
 *
 * Antes se agrupaba por SKU, y con el mismo artículo en dos renglones (19 + 1)
 * ambos mostraban el total armado: el chequeador veía dos filas "de más" y un
 * pedido correcto parecía tener diferencias.
 */
export function aggregatePickedByLine(bultos: Bulto[]): Map<string, number> {
  const picked = new Map<string, number>();
  for (const bulto of bultos) {
    for (const item of bulto.items) {
      picked.set(item.lineId, (picked.get(item.lineId) ?? 0) + item.qty);
    }
  }
  return picked;
}

export function buildAuditComparison(snapshot: OrderLine[], bultos: Bulto[]): AuditComparisonRow[] {
  const pickedByLine = aggregatePickedByLine(bultos);
  const rows: AuditComparisonRow[] = [];

  for (const line of snapshot) {
    const picked = pickedByLine.get(line.id) ?? 0;
    const diff = picked - line.requiredQty;
    rows.push({
      lineId: line.id,
      sku: line.sku,
      name: line.name,
      required: line.requiredQty,
      picked,
      diff,
      status: diff === 0 ? 'ok' : diff > 0 ? 'over' : 'under',
    });
    pickedByLine.delete(line.id);
  }

  // Lo que quedó sin renglón: armado que el pedido no pedía, o cuyo renglón ya
  // no existe tras una reimportación. Se muestra como sobrante para que el
  // chequeador lo vea en vez de que desaparezca.
  for (const [lineId, picked] of pickedByLine) {
    const sku = lineId.includes('#') ? lineId.slice(0, lineId.lastIndexOf('#')) : lineId;
    rows.push({
      lineId,
      sku,
      name: sku,
      required: 0,
      picked,
      diff: picked,
      status: 'over',
    });
  }

  return rows;
}

export function hasComparisonIssues(rows: AuditComparisonRow[]): boolean {
  return rows.some((row) => row.status !== 'ok');
}
