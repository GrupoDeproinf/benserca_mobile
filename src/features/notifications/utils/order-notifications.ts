import type { TFunction } from 'i18next';
import type { Order, OrderStatus } from '@/features/picking/types';
import type { NotificationType, UserRole } from '@/shared/types';

/** Firma ligera de un pedido para detectar "actualizaciones" sin ruido. */
export interface OrderSnapshotSig {
  status: OrderStatus;
  sig: string;
}

export function buildOrderSignature(order: Order): string {
  return [
    order.definedBultos,
    order.client,
    order.lines.length,
    order.isCritical ? 1 : 0,
  ].join('|');
}

export function toSnapshotMap(orders: Order[]): Map<string, OrderSnapshotSig> {
  return new Map(
    orders.map((o) => [o.id, { status: o.status, sig: buildOrderSignature(o) }]),
  );
}

export interface DerivedNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  orderId?: string;
}

/**
 * Genera notificaciones locales comparando el snapshot anterior del listener
 * con el actual. Solo cubre `order_ready_to_audit` (cola interna del
 * chequeador): NO está en el catálogo compartido de `notifications.md`, así
 * que no tiene equivalente en Firestore.
 *
 * Todo lo que sí está en el catálogo compartido (pedido asignado, rechazado,
 * aprobado, actualizado) ya NO se deriva aquí: llega vía
 * `useFirestoreNotificationsListener` (lectura) o se crea explícitamente en
 * `orders.store.ts` en el momento de la acción (escritura).
 *
 * En el primer snapshot `prev` es null: solo se siembra la referencia, no se
 * disparan notificaciones (evita avisar de todo lo preexistente al abrir la app).
 */
export function deriveOrderNotifications(
  role: UserRole,
  prev: Map<string, OrderSnapshotSig> | null,
  current: Order[],
  t: TFunction,
): DerivedNotification[] {
  if (!prev || role !== 'auditor') return [];
  const out: DerivedNotification[] = [];

  for (const order of current) {
    // El listener del chequeador solo trae pedidos en "Empaquetado":
    // uno nuevo = recién finalizado por un picker, listo para chequear.
    if (!prev.get(order.id)) {
      out.push({
        userId: `broadcast-${role}`,
        type: 'order_ready_to_audit',
        title: t('notifications.push.readyToCheckTitle', { order: order.orderNumber }),
        body: t('notifications.push.readyToCheckBody', { client: order.client }),
        orderId: order.id,
      });
    }
  }

  return out;
}
