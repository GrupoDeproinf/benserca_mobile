import type { UserRole } from '@/shared/types';
import type { Order, OrderDomainAction, OrderStatus, PauseReason } from '../types';

export const ORDER_STATUS_I18N_KEY: Record<OrderStatus, string> = {
  new: 'orderStatus.new',
  assigned: 'orderStatus.assigned',
  in_progress: 'orderStatus.inProgress',
  to_pack: 'orderStatus.toPack',
  packed: 'orderStatus.packed',
  rejected_review: 'orderStatus.rejectedReview',
  audited: 'orderStatus.audited',
  dispatched: 'orderStatus.dispatched',
  annulled: 'orderStatus.annulled',
  recovered: 'orderStatus.recovered',
};

/**
 * ¿Este pedido vuelve al chequeo DESPUÉS de un rechazo?
 *
 * No hace falta un estatus nuevo: el rechazo deja `audit.result: 'rejected'` en
 * el documento y nadie lo limpia hasta que se apruebe. Así que un pedido que
 * está otra vez en `Empaquetado` y sigue marcado como rechazado es, por
 * definición, uno que el picker ya corrigió.
 */
export function wasCorrectedAfterRejection(order: Order): boolean {
  return order.status === 'to_pack' && order.auditResult === 'rejected';
}

export function statusLabelKey(status: OrderStatus): string {
  return ORDER_STATUS_I18N_KEY[status];
}

/**
 * La pausa NO es un estatus en base de datos (el pedido conserva el suyo), pero
 * en la UI el badge de "En pausa" reemplaza al del estatus, tanto en las listas
 * como en el detalle. Estas dos constantes mantienen ese badge consistente.
 */
export const PAUSED_STATUS_I18N_KEY = 'orderStatus.paused';

export const PAUSED_BADGE_STYLE = { bg: '#FEF3C7', text: '#B45309' };

/**
 * Clave i18n del cuerpo del banner de pausa según el motivo. Se usa igual en
 * picking, auditoría y el detalle del jefe de almacén para no repetir el
 * ternario en cada pantalla. `bannerBodyMissing` y `bannerBodyDuplicate`
 * esperan un param `{{skus}}`; `bannerBodyPriority` no usa ninguno (pasarlo
 * igual no rompe nada, i18next ignora los params que la clave no referencia).
 */
export function pauseBannerBodyKey(reason: PauseReason): string {
  if (reason === 'falta_articulo') return 'picking.pause.bannerBodyMissing';
  if (reason === 'sku_duplicado') return 'picking.pause.bannerBodyDuplicate';
  return 'picking.pause.bannerBodyPriority';
}

const MOBILE_TRANSITIONS: Partial<
  Record<OrderStatus, Partial<Record<UserRole, readonly OrderStatus[]>>>
> = {
  assigned: { picker: ['in_progress'] },
  in_progress: { picker: ['to_pack'] },
  // Chequeo obligatorio: desde Empaquetado solo el chequeador aprueba/rechaza.
  // El picker ya no puede marcar como embalado directamente.
  to_pack: { auditor: ['audited', 'rejected_review'] },
  audited: { picker: ['packed'] },
  packed: {
    picker: ['dispatched'],
    warehouse_lead: ['dispatched'],
  },
  rejected_review: { picker: ['in_progress'] },
};

export function canTransition(from: OrderStatus, to: OrderStatus, role: UserRole): boolean {
  const allowed = MOBILE_TRANSITIONS[from]?.[role];
  return allowed?.includes(to) ?? false;
}

export function nextActionsFor(order: Order, role: UserRole): OrderDomainAction[] {
  switch (order.status) {
    case 'assigned':
      return role === 'picker' ? ['start_picking'] : [];
    case 'in_progress':
      return role === 'picker' ? ['open_bulto', 'finish_picking'] : [];
    case 'to_pack':
      // Chequeo obligatorio: el picker espera; solo el chequeador actúa.
      return role === 'auditor' ? ['approve_audit', 'reject_audit'] : [];
    case 'audited':
      return role === 'picker' ? ['mark_wrapped'] : [];
    case 'packed':
      return role === 'picker' || role === 'warehouse_lead' ? ['mark_dispatched'] : [];
    case 'rejected_review':
      return role === 'picker' ? ['reopen_for_revision'] : [];
    default:
      return [];
  }
}

/**
 * Opción de un filtro de lista de pedidos: un estatus, `paused` (que NO es un
 * estatus en base de datos, ver `PAUSED_STATUS_I18N_KEY`), `corrected` (pedido
 * que el picker ya rehizo tras un rechazo) o `all`.
 *
 * Vive aquí, y no en cada pantalla, porque picker, jefe de almacén y chequeador
 * filtran sobre los mismos pedidos y antes cada uno resolvía la etiqueta a su
 * manera: el que no estuviera en `ORDER_STATUS_I18N_KEY` salía sin traducir.
 */
export type OrderListFilter = OrderStatus | 'paused' | 'corrected' | 'all';

export function orderListFilterLabelKey(filter: OrderListFilter): string {
  if (filter === 'all') return 'common.all';
  if (filter === 'paused') return PAUSED_STATUS_I18N_KEY;
  if (filter === 'corrected') return 'orderStatus.corrected';
  return ORDER_STATUS_I18N_KEY[filter];
}

/** ¿El pedido entra en el filtro elegido? `all` no descarta nada. */
export function matchesOrderListFilter(order: Order, filter: OrderListFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'paused') return order.isPaused;
  if (filter === 'corrected') return wasCorrectedAfterRejection(order);
  // Un pedido en pausa conserva su estatus, así que sigue saliendo al filtrar
  // por él: el badge de "En pausa" es de UI, no un estatus aparte.
  return order.status === filter;
}
