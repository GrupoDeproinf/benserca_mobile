import firestore from '@react-native-firebase/firestore';
import type { SessionUser } from '@/shared/types';
import type { FinalSku, Order } from '../types';

const ORDERS = 'lo_orders';

function now() {
  return new Date().toISOString();
}

function timelineEntry(status: string, user: SessionUser, note?: string) {
  return {
    status,
    timestamp: now(),
    user_uid: user.uid,
    user_name: user.name,
    note: note ?? null,
  };
}

function finalSkusToFirestore(finalSkus: FinalSku[]) {
  return finalSkus.map((s) => ({
    original_sku: s.originalSku,
    original_quantity: s.originalQuantity,
    packed_sku: s.packedSku,
    packed_quantity: s.packedQuantity,
    difference: s.difference,
    substituted: s.substituted,
    substitution_note: s.substitutionNote,
    bundles: s.bundles.map((b) => ({ bundle_num: b.bundleNum, quantity: b.quantity })),
  }));
}

export async function firestoreStartPicking(orderId: string, user: SessionUser): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      status: 'En proceso',
      picking_started_at: now(),
      updated_at: now(),
      timeline: firestore.FieldValue.arrayUnion(timelineEntry('En proceso', user)),
    });
}

export async function firestorePartialSave(
  orderId: string,
  progressPercentage: number,
  bundlesCreated: number,
  finalSkus: FinalSku[],
): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      progress_percentage: progressPercentage,
      bundles_created: bundlesCreated,
      final_skus: finalSkusToFirestore(finalSkus),
      updated_at: now(),
    });
}

export async function firestoreFinishPicking(
  orderId: string,
  order: Order,
  user: SessionUser,
): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      status: 'Empaquetado',
      picking_finished_at: now(),
      updated_at: now(),
      progress_percentage: 100,
      bundles_created: order.bundlesCreated,
      extra_bundles_flag: order.hasExtraBultos,
      final_skus: finalSkusToFirestore(order.finalSkus),
      timeline: firestore.FieldValue.arrayUnion(timelineEntry('Empaquetado', user)),
    });
}

export async function firestoreMarkWrapped(orderId: string, user: SessionUser): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      status: 'Embalado',
      wrapped_at: now(),
      updated_at: now(),
      timeline: firestore.FieldValue.arrayUnion(timelineEntry('Embalado', user)),
    });
}

export async function firestoreReopenForRevision(
  orderId: string,
  user: SessionUser,
): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      status: 'En proceso',
      updated_at: now(),
      timeline: firestore.FieldValue.arrayUnion(
        timelineEntry('En proceso', user, 'Reabierto para corrección tras rechazo de auditoría'),
      ),
    });
}

export async function firestoreApproveAudit(
  orderId: string,
  user: SessionUser,
): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      status: 'Auditado',
      audited_at: now(),
      updated_at: now(),
      'audit.audited_by_uid': user.uid,
      'audit.audited_by_name': user.name,
      'audit.result': 'approved',
      'audit.observation': null,
      'audit.audited_at': now(),
      timeline: firestore.FieldValue.arrayUnion(timelineEntry('Auditado', user)),
    });
}

export async function firestoreRejectAudit(
  orderId: string,
  user: SessionUser,
  observation: string,
): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      status: 'Empaquetado',
      updated_at: now(),
      'audit.audited_by_uid': user.uid,
      'audit.audited_by_name': user.name,
      'audit.result': 'rejected',
      'audit.observation': observation,
      'audit.audited_at': now(),
      timeline: firestore.FieldValue.arrayUnion(
        timelineEntry('Empaquetado', user, `Rechazado por auditoría: ${observation}`),
      ),
    });
}
