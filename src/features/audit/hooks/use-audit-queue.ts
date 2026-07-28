import { useMemo } from 'react';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { Order } from '@/features/picking/types';

/**
 * Cola del chequeador: Empaquetado (para aprobar/rechazar) + cualquier pedido
 * pausado (para reanudar), en la misma lista.
 */
export function useAuditQueue(): Order[] {
  const orders = useOrdersStore((s) => s.orders);
  return useMemo(
    () => orders.filter((o) => o.status === 'to_pack' || o.isPaused),
    [orders],
  );
}
