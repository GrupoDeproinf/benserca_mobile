import { useMemo } from 'react';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { Order } from '@/features/picking/types';

/** Devuelve los pedidos en estatus `packed` (cola de auditoría). */
export function useAuditQueue(): Order[] {
  const orders = useOrdersStore((s) => s.orders);
  return useMemo(() => orders.filter((o) => o.status === 'packed'), [orders]);
}
