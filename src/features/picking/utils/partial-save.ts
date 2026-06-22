import type { Order } from '../types';
import { computeProgressPercentage } from './order-progress';
import { buildFinalSkus } from './order-snapshot';
import { computeBundlesCreated } from './order-progress';

export const SAVE_MILESTONES = [25, 50, 75, 100] as const;

export function getNextSaveMilestone(
  progressPercentage: number,
  lastSavedMilestone: number,
): number | null {
  for (const milestone of SAVE_MILESTONES) {
    if (progressPercentage >= milestone && lastSavedMilestone < milestone) {
      return milestone;
    }
  }
  return null;
}

/** Simula guardado parcial a Firestore: solo bultos cerrados. */
export function buildPartialSavePatch(order: Order, milestone: number): Partial<Order> {
  const closedBultos = order.bultos.filter((b) => b.status === 'closed');
  const progressPercentage = computeProgressPercentage(order);

  return {
    finalSkus: buildFinalSkus(order, closedBultos),
    progressPercentage,
    bundlesCreated: computeBundlesCreated(order.bultos),
    lastSavedMilestone: milestone,
  };
}

export function maybePartialSaveAfterClose(order: Order): Partial<Order> | null {
  const progressPercentage = computeProgressPercentage(order);
  const milestone = getNextSaveMilestone(progressPercentage, order.lastSavedMilestone);
  if (!milestone) return null;
  return buildPartialSavePatch(order, milestone);
}
