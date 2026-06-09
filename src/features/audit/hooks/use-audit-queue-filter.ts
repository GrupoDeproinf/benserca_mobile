import type { Order } from '@/features/picking/types';

export type AuditQueueFilter = 'all' | 'extra_bultos' | 'standard';

export const AUDIT_QUEUE_FILTERS: AuditQueueFilter[] = ['all', 'extra_bultos', 'standard'];

export function applyAuditQueueFilter(orders: Order[], filter: AuditQueueFilter): Order[] {
  if (filter === 'all') return orders;
  if (filter === 'extra_bultos') return orders.filter((o) => o.hasExtraBultos);
  return orders.filter((o) => !o.hasExtraBultos);
}

export function auditFilterLabelKey(filter: AuditQueueFilter): string {
  if (filter === 'all') return 'common.all';
  return `audit.filter.${filter}`;
}
