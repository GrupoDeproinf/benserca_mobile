import type { Order, OrderStatus } from '@/features/picking/types';
import type { PickerStatus } from '../types';

export interface PickerActivity {
  status: PickerStatus;
  activeOrder: Order | null;
}

/**
 * El estado del picker se deriva principalmente de sus pedidos visibles en el
 * store del jefe (`team.chief_uid`), que no siempre cubre todos los pedidos
 * del picker (ej. pedidos sin equipo asignado). Como red de seguridad, si no
 * se encuentra ningún pedido activo pero `u_pickers.is_available` dice que
 * está ocupado, se respeta ese flag en vez de mostrarlo como libre.
 */

/** Estados de pedido que cuentan como "picker ocupado". */
const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'assigned',
  'in_progress',
  'rejected_review',
  'to_pack',
  'audited',
];

/** Prioridad para elegir el pedido "activo" cuando el picker tiene varios. */
const ACTIVE_PRIORITY: OrderStatus[] = [
  'in_progress',
  'rejected_review',
  'to_pack',
  'audited',
  'assigned',
];

function orderStatusToPickerStatus(status: OrderStatus): PickerStatus {
  switch (status) {
    case 'in_progress':
    case 'rejected_review':
      return 'en_proceso';
    case 'to_pack':
    case 'audited':
      return 'por_embalar';
    case 'assigned':
      return 'reservado';
    default:
      return 'disponible';
  }
}

export function derivePickerActivity(
  pickerUid: string,
  orders: Order[],
  isAvailable: boolean = true,
): PickerActivity {
  const mine = orders.filter(
    (o) => o.assignedPickerId === pickerUid && ACTIVE_ORDER_STATUSES.includes(o.status),
  );
  if (mine.length === 0) {
    return isAvailable
      ? { status: 'disponible', activeOrder: null }
      : { status: 'en_proceso', activeOrder: null };
  }

  const active = [...mine].sort(
    (a, b) => ACTIVE_PRIORITY.indexOf(a.status) - ACTIVE_PRIORITY.indexOf(b.status),
  )[0];

  return { status: orderStatusToPickerStatus(active.status), activeOrder: active };
}
