import type { Order } from '../types';
import { buildFinalState } from './order-snapshot';

/** Progreso de picking 0–1 según cantidades pickeadas vs requeridas. */
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

  const requiredTotal = order.lines.reduce((sum, line) => sum + line.requiredQty, 0);
  if (requiredTotal === 0) return 0;

  const picked = buildFinalState(order.bultos).reduce((sum, item) => sum + item.qty, 0);
  return Math.min(1, picked / requiredTotal);
}
