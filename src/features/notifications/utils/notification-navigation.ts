import { getRoleRouteSegment } from '@/features/auth/constants/routes';
import type { UserRole } from '@/shared/types';

/** Ruta de detalle de pedido según rol, si la notificación tiene `orderId`. */
export function getNotificationOrderHref(
  role: UserRole,
  orderId: string,
): string | null {
  const segment = getRoleRouteSegment(role);
  switch (role) {
    case 'picker':
      return `/(app)/${segment}/order/${orderId}`;
    case 'warehouse_lead':
      return `/(app)/${segment}/team/${orderId}`;
    case 'auditor':
      return `/(app)/${segment}/audit/${orderId}`;
    // supervisor_almacen es visualizador: no recibe notificaciones navegables.
    default:
      return null;
  }
}
