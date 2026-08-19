import { useEffect, useMemo, useRef } from 'react';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { OrderStatus } from '@/features/picking/types';
import { releasePickerIfStuck } from '../services/picker-availability.service';

/** Roles que trabajan pedidos y por lo tanto ocupan un puesto en el almacén. */
const OPERATIONAL_ROLES = new Set(['picker', 'warehouse_lead']);

/** Un pedido en estos estatus mantiene ocupado a quien lo trabaja. */
const ACTIVE_STATUSES: OrderStatus[] = [
  'assigned',
  'in_progress',
  'rejected_review',
  'to_pack',
  'audited',
];

/**
 * Reconcilia el `is_available` del usuario actual contra sus pedidos reales.
 *
 * Sin esto el flag se queda pegado en `false` y el picker aparece ocupado sin
 * tener nada (ver releasePickerIfStuck). Corre en el dispositivo del propio
 * picker, que es el único que ve todos sus pedidos: los asignados a él y
 * aquellos donde forma parte del equipo.
 *
 * Montado en (app)/_layout; se ignora solo para los roles que no pickean.
 */
export function usePickerAvailabilitySync() {
  const user = useCurrentUser();
  const orders = useOrdersStore((s) => s.orders);
  const hydratedFromServer = useOrdersStore((s) => s.hydratedFromServer);

  const hasActiveOrder = useMemo(() => {
    if (!user) return false;
    return orders.some(
      (o) =>
        (o.assignedPickerId === user.uid || o.teamPickerUids.includes(user.uid)) &&
        // Un pedido pausado libera al picker (firestorePausePicking ya pone
        // `is_available: true`), así que no cuenta como ocupación.
        !o.isPaused &&
        ACTIVE_STATUSES.includes(o.status),
    );
  }, [orders, user]);

  /** Evita repetir la escritura mientras el estado siga siendo el mismo. */
  const releasedRef = useRef(false);

  useEffect(() => {
    if (!user || !OPERATIONAL_ROLES.has(user.role)) return;

    // Sin lista del servidor no se puede afirmar "no tiene pedidos": puede ser
    // que todavía no haya llegado.
    if (!hydratedFromServer) return;

    if (hasActiveOrder) {
      releasedRef.current = false;
      return;
    }

    if (releasedRef.current) return;
    releasedRef.current = true;

    releasePickerIfStuck(user.uid).then((released) => {
      if (released) {
        console.warn(
          `[picker-availability] ${user.uid} estaba marcado ocupado sin pedidos activos; se liberó.`,
        );
      }
    });
  }, [user, hydratedFromServer, hasActiveOrder]);
}
