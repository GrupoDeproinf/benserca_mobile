import { useMemo } from 'react';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { useOrdersStore } from '../store/orders.store';
import type { Order, OrderStatus } from '../types';

/** Filtros que puede activar el picker en su lista. */
export type PickerOrderFilter = OrderStatus | 'all';

/** Devuelve los pedidos del picker autenticado desde el store (alimentado por useSessionOrdersListener). */
export function usePickerOrders(filter: PickerOrderFilter = 'all'): Order[] {
  const user = useCurrentUser();
  const orders = useOrdersStore((s) => s.orders);

  return useMemo(() => {
    if (!user) return [];
    // El pedido debería desasignarse al anular/recuperar; este filtro es una red
    // de seguridad por si esa desasignación falla.
    const mine = orders.filter(
      (o) =>
        (o.assignedPickerId === user.uid || o.teamPickerUids.includes(user.uid)) &&
        o.status !== 'annulled' &&
        o.status !== 'recovered',
    );
    if (filter === 'all') return mine;
    return mine.filter((o) => o.status === filter);
  }, [user, orders, filter]);
}

/** Estatus que el picker puede ver en su lista (según blueprint §M2). */
export const PICKER_FILTER_STATUSES: PickerOrderFilter[] = [
  'all',
  'assigned',
  'in_progress',
  'to_pack',
  'packed',
  'rejected_review',
];
