import type { UserRole } from '@/shared/types';
import type { Order, OrderDomainAction, OrderStatus } from '../types';

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
