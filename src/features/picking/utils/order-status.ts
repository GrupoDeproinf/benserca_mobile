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
};

export function statusLabelKey(status: OrderStatus): string {
  return ORDER_STATUS_I18N_KEY[status];
}

/** Transiciones permitidas desde la app móvil por rol (PASO_A_PASO §1.2). */
const MOBILE_TRANSITIONS: Partial<
  Record<OrderStatus, Partial<Record<UserRole, readonly OrderStatus[]>>>
> = {
  assigned: { picker: ['in_progress'] },
  in_progress: { picker: ['to_pack'] },
  to_pack: { picker: ['packed'] },
  packed: { auditor: ['audited', 'rejected_review'] },
  rejected_review: { picker: ['to_pack'] },
};

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: UserRole,
): boolean {
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
      return role === 'picker' ? ['mark_packed'] : [];
    case 'packed':
      return role === 'auditor' ? ['approve_audit', 'reject_audit'] : [];
    case 'rejected_review':
      return role === 'picker' ? ['reopen_for_revision'] : [];
    default:
      return [];
  }
}
