import type { Order } from '../types';
import { countClosedBultosWithItems } from './order-snapshot';

/** Progreso 0–1 según bultos cerrados / bultos definidos (tope 100%). */
export function computePickingProgress(order: Order): number {
  if (order.status === 'assigned' || order.status === 'new') return 0;

  if (
    order.status === 'to_pack' ||
    order.status === 'packed' ||
    order.status === 'audited' ||
    order.status === 'dispatched'
  ) {
    return 1;
  }

  if (order.definedBultos <= 0) return 0;

  const closed = countClosedBultosWithItems(order.bultos);
  return Math.min(1, closed / order.definedBultos);
}

export function computeProgressPercentage(order: Order): number {
  return Math.round(computePickingProgress(order) * 100);
}

export function computeBundlesCreated(bultos: Order['bultos']): number {
  return countClosedBultosWithItems(bultos);
}
