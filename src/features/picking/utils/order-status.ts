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

const MOBILE_TRANSITIONS: Partial<
  Record<OrderStatus, Partial<Record<UserRole, readonly OrderStatus[]>>>
> = {
  assigned: { picker: ['in_progress'] },
  in_progress: { picker: ['to_pack'] },
  to_pack: { picker: ['packed'], auditor: ['audited', 'rejected_review'] },
  audited: { picker: ['packed'] },
  rejected_review: { picker: ['in_progress'] },
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
      return role === 'picker'
        ? ['mark_wrapped']
        : role === 'auditor'
          ? ['approve_audit', 'reject_audit']
          : [];
    case 'audited':
      return role === 'picker' ? ['mark_wrapped'] : [];
    case 'rejected_review':
      return role === 'picker' ? ['reopen_for_revision'] : [];
    default:
      return [];
  }
}
