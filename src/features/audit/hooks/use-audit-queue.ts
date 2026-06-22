import { useMemo } from 'react';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { Order } from '@/features/picking/types';

/** Cola de auditoría: pedidos empaquetados (antes del embalaje). */
export function useAuditQueue(): Order[] {
  const orders = useOrdersStore((s) => s.orders);
  return useMemo(() => orders.filter((o) => o.status === 'to_pack'), [orders]);
}
