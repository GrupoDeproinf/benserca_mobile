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
 *
 * Pero ese flag se queda pegado con facilidad: solo lo escribe el dispositivo
 * del propio picker (iniciar / reanudar lo ponen en `false`; finalizar y pausar
 * en `true`), así que todo lo que termine el pedido FUERA de ahí —anulación o
 * reasignación desde la web, un despacho hecho por otro, o simplemente que la
 * escritura falle— lo deja en `false` para siempre y el picker aparece ocupado
 * sin tener nada. Por eso el flag solo se respeta si además viene corroborado
 * por `current_order_id`: sin ese id, o si ese pedido SÍ es visible y ya no
 * está activo, el flag se considera vencido y el picker se muestra libre.
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
  /** `current_order_id` del doc en `u_pickers`: respalda a `is_available: false`. */
  currentOrderId: string | null = null,
): PickerActivity {
  // Un pedido pausado NO ocupa al picker: al pausar queda libre para tomar otro
  // (ver firestorePausePicking, que además pone `is_available: true`). Se excluye
  // para que la derivación sea coherente con ese flag.
  const mine = orders.filter(
    (o) =>
      o.assignedPickerId === pickerUid && !o.isPaused && ACTIVE_ORDER_STATUSES.includes(o.status),
  );
  if (mine.length === 0) {
    if (isAvailable) return { status: 'disponible', activeOrder: null };

    // Flag sin pedido que lo respalde: nadie puede confirmar en qué está
    // ocupado, así que se asume vencido.
    if (!currentOrderId) return { status: 'disponible', activeOrder: null };

    // El pedido que el flag señala SÍ es visible y no quedó entre los activos
    // (terminó, se anuló o está pausado): el flag quedó atrás.
    const flagged = orders.find((o) => o.id === currentOrderId);
    if (flagged) return { status: 'disponible', activeOrder: null };

    // No hay forma de verlo desde acá (pedido fuera del alcance del listener):
    // se respeta el flag.
    return { status: 'en_proceso', activeOrder: null };
  }

  const active = [...mine].sort(
    (a, b) => ACTIVE_PRIORITY.indexOf(a.status) - ACTIVE_PRIORITY.indexOf(b.status),
  )[0];

  return { status: orderStatusToPickerStatus(active.status), activeOrder: active };
}
