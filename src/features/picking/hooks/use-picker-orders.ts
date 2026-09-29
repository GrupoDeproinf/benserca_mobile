import { useMemo } from 'react';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { useOrdersStore } from '../store/orders.store';
import type { Order } from '../types';
import { matchesOrderListFilter, type OrderListFilter } from '../utils/order-status';

/** Filtros que puede activar el picker en su lista. */
export type PickerOrderFilter = OrderListFilter;

/** Devuelve los pedidos del picker autenticado desde el store (alimentado por useSessionOrdersListener). */
export function usePickerOrders(filter: PickerOrderFilter = 'all'): Order[] {
  const user = useCurrentUser();
  const orders = useOrdersStore((s) => s.orders);

  return useMemo(() => {
    if (!user) return [];
    // El pedido debería desasignarse al anular/recuperar; este filtro es una red
    // de seguridad por si esa desasignación falla. Embalado es el último paso del
    // picker: al marcarlo el pedido sale de su lista (y despachado, que viene
    // después, tampoco se muestra).
    const mine = orders.filter(
      (o) =>
        (o.assignedPickerId === user.uid || o.teamPickerUids.includes(user.uid)) &&
        o.status !== 'annulled' &&
        o.status !== 'recovered' &&
        o.status !== 'packed' &&
        o.status !== 'dispatched',
    );
    if (filter === 'all') return mine;
    return mine.filter((o) => matchesOrderListFilter(o, filter));
  }, [user, orders, filter]);
}

/**
 * Estatus que el picker puede ver en su lista (según blueprint §M2).
 *
 * `audited` estaba fuera de la lista aunque esos pedidos SÍ salen en "Todos"
 * (es el paso en el que el picker debe marcar "embalado"), así que no había
 * forma de filtrarlos. `paused` no es un estatus, pero es la situación por la
 * que el picker más pregunta, y `matchesOrderListFilter` la resuelve.
 */
export const PICKER_FILTER_STATUSES: PickerOrderFilter[] = [
  'all',
  'assigned',
  'in_progress',
  'to_pack',
  'audited',
  'rejected_review',
  'paused',
];
