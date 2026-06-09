import type { Bulto, OrderLine } from '@/features/picking/types';

export type AuditComparisonStatus = 'ok' | 'over' | 'under';

export interface AuditComparisonRow {
  sku: string;
  name: string;
  required: number;
  picked: number;
  diff: number;
  status: AuditComparisonStatus;
}

export function aggregatePickedBySku(bultos: Bulto[]): Map<string, number> {
  const picked = new Map<string, number>();
  for (const bulto of bultos) {
    for (const item of bulto.items) {
      picked.set(item.sku, (picked.get(item.sku) ?? 0) + item.qty);
    }
  }
  return picked;
}

export function buildAuditComparison(
  snapshot: OrderLine[],
  bultos: Bulto[],
): AuditComparisonRow[] {
  const pickedBySku = aggregatePickedBySku(bultos);
  const seen = new Set<string>();
  const rows: AuditComparisonRow[] = [];

  for (const line of snapshot) {
    seen.add(line.sku);
    const picked = pickedBySku.get(line.sku) ?? 0;
    const diff = picked - line.requiredQty;
    rows.push({
      sku: line.sku,
      name: line.name,
      required: line.requiredQty,
      picked,
      diff,
      status: diff === 0 ? 'ok' : diff > 0 ? 'over' : 'under',
    });
  }

  for (const [sku, picked] of pickedBySku) {
    if (seen.has(sku)) continue;
    rows.push({
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
