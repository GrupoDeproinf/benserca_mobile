import firestore from '@react-native-firebase/firestore';
import type { SessionUser } from '@/shared/types';
import type { FinalSku, Order, OrderStatus, PauseReason } from '../types';

const ORDERS = 'lo_orders';

/** Mapa inverso de `mapStatus` (orders.mapper): OrderStatus interno → string Firestore. */
const STATUS_TO_FIRESTORE: Record<OrderStatus, string> = {
  new: 'Nuevo',
  assigned: 'Asignado',
  in_progress: 'En proceso',
  to_pack: 'Empaquetado',
  audited: 'Auditado',
  packed: 'Embalado',
  rejected_review: 'Rechazado',
  dispatched: 'Despachado',
  annulled: 'Anulado',
  recovered: 'Recuperado',
};

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

/**
 * Refleja en `u_pickers/{uid}` si el picker está ocupado con un pedido activo.
 * No crítico: si falla no debe bloquear la transición del pedido, que es la
 * fuente de verdad real. Pero SÍ se loguea: un fallo aquí (típicamente porque
 * el doc de `u_pickers` no tiene como id el `uid` de Auth, ver user-profile)
 * deja `is_available` desincronizado y hace que el picker aparezca disponible
 * aunque esté ocupado. Debe ser visible en logs, no tragado en silencio.
 */
async function updatePickerAvailability(
  pickerUid: string,
  isAvailable: boolean,
  currentOrderId: string | null,
): Promise<void> {
  try {
    await firestore().collection('u_pickers').doc(pickerUid).update({
      is_available: isAvailable,
      current_order_id: currentOrderId,
      last_activity_at: now(),
    });
  } catch (e) {
    console.error(
      `[orders.service] updatePickerAvailability falló para ${pickerUid} ` +
        `(is_available=${isAvailable}). El flag quedará desincronizado.`,
      e,
    );
  }
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
  await updatePickerAvailability(user.uid, false, orderId);
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
  await updatePickerAvailability(user.uid, true, null);
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

/** Pasa de Embalado → Despachado: solo status + timeline (+ dispatched_at). */
export async function firestoreMarkDispatched(orderId: string, user: SessionUser): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      status: 'Despachado',
      dispatched_at: now(),
      updated_at: now(),
      timeline: firestore.FieldValue.arrayUnion(timelineEntry('Despachado', user)),
    });
}

export interface TeamPickerRef {
  uid: string;
  name: string;
}

/**
 * Arma el equipo de pickers de un pedido grande. Escribe `team.pickers`
 * (para mostrar en UI) y `team.picker_uids` (array plano de uids, usado por
 * el listener del picker vía `array-contains` ya que Firestore no permite
 * consultar por un campo dentro de objetos en un array).
 */
/**
 * El jefe de almacén se pone a sí mismo como picker del pedido para trabajarlo
 * sin armar equipo. Deja `team` vacío a propósito: no hay equipo que liberar
 * después, y así el pedido se distingue de uno trabajado en grupo.
 */
export async function firestoreAssignSelfAsPicker(
  orderId: string,
  user: SessionUser,
): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      assigned_to: { type: 'picker', uid: user.uid, name: user.name },
      'team.chief_uid': user.uid,
      'team.chief_name': user.name,
      updated_at: now(),
      timeline: firestore.FieldValue.arrayUnion(
        timelineEntry('Asignado', user, 'El jefe de almacén trabaja el pedido sin equipo'),
      ),
    });
}

export async function firestoreAssignTeam(
  orderId: string,
  chief: SessionUser,
  pickers: TeamPickerRef[],
): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      'team.chief_uid': chief.uid,
      'team.chief_name': chief.name,
      'team.pickers': pickers.map((p) => ({ uid: p.uid, name: p.name, type: 'picker' })),
      'team.picker_uids': pickers.map((p) => p.uid),
      updated_at: now(),
      timeline: firestore.FieldValue.arrayUnion(
        timelineEntry('Asignado', chief, `Equipo armado: ${pickers.map((p) => p.name).join(', ')}`),
      ),
    });
}

/** Ajusta la lista de pickers del equipo (liberar uno o todo el equipo). */
export async function firestoreUpdateTeamPickers(
  orderId: string,
  pickers: TeamPickerRef[],
): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      'team.pickers': pickers.map((p) => ({ uid: p.uid, name: p.name, type: 'picker' })),
      'team.picker_uids': pickers.map((p) => p.uid),
      updated_at: now(),
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
  await updatePickerAvailability(user.uid, false, orderId);
}

/**
 * Pausa el pedido SIN cambiar `status`. Marca el booleano `is_paused` y hace
 * push de una entrada al `timeline` con `status: 'Pausa'` + los campos extra
 * `reason` / `missing_skus` / `user_role`. La app y la web leen `is_paused`
 * como fuente de verdad; el detalle de la pausa vive en esa entrada de timeline.
 */
export async function firestorePausePicking(
  orderId: string,
  user: SessionUser,
  reason: PauseReason,
  missingSkus: string[],
  fromStatus: OrderStatus,
): Promise<void> {
  const fromLabel = STATUS_TO_FIRESTORE[fromStatus] ?? 'En proceso';
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      is_paused: true,
      updated_at: now(),
      timeline: firestore.FieldValue.arrayUnion({
        status: 'Pausa',
        timestamp: now(),
        user_uid: user.uid,
        user_name: user.name,
        user_role: user.role,
        note: `Pedido pausado desde estatus «${fromLabel}».`,
        reason,
        missing_skus: missingSkus,
      }),
    });
  // Al pausar, el picker queda libre para tomar otro pedido.
  await updatePickerAvailability(user.uid, true, null);
}

/**
 * Quita la pausa SIN alterar el flujo: restaura `is_paused: false` y hace push
 * de una entrada al `timeline` con el estatus operativo actual (que la app ya
 * tiene en memoria, porque la pausa nunca lo cambió).
 */
export async function firestoreResumePicking(
  orderId: string,
  user: SessionUser,
  toStatus: OrderStatus,
): Promise<void> {
  const toLabel = STATUS_TO_FIRESTORE[toStatus] ?? 'En proceso';
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      is_paused: false,
      updated_at: now(),
      timeline: firestore.FieldValue.arrayUnion({
        status: toLabel,
        timestamp: now(),
        user_uid: user.uid,
        user_name: user.name,
        user_role: user.role,
        note: `Pausa quitada. Vuelve a estatus «${toLabel}».`,
      }),
    });
  // Al reanudar, el picker vuelve a estar ocupado con este pedido.
  await updatePickerAvailability(user.uid, false, orderId);
}

export async function firestoreApproveAudit(orderId: string, user: SessionUser): Promise<void> {
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
      'audit.rejected_bundles': [],
      'audit.approved_bundles': [],
      'audit.audited_at': now(),
      timeline: firestore.FieldValue.arrayUnion(timelineEntry('Auditado', user)),
    });
}

export async function firestoreRejectAudit(
  orderId: string,
  user: SessionUser,
  observation: string,
  rejectedBundles: number[],
  approvedBundles: number[],
): Promise<void> {
  await firestore()
    .collection(ORDERS)
    .doc(orderId)
    .update({
      status: 'Rechazado',
      updated_at: now(),
      'audit.audited_by_uid': user.uid,
      'audit.audited_by_name': user.name,
      'audit.result': 'rejected',
      'audit.observation': observation,
      // Sin esto el picker no tiene cómo saber qué bultos debe corregir: la
      // observación es texto libre y no es interpretable por la app.
      'audit.rejected_bundles': rejectedBundles,
      'audit.approved_bundles': approvedBundles,
      'audit.audited_at': now(),
      timeline: firestore.FieldValue.arrayUnion(
        timelineEntry('Rechazado', user, `Rechazado por auditoría: ${observation}`),
      ),
    });
}
