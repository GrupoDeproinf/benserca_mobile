import type { Order, OrderLine, OrderStatus } from '../types';

/** Mapea el status string de Firestore al OrderStatus interno. */
function mapStatus(raw: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    Nuevo: 'new',
    Asignado: 'assigned',
    'En proceso': 'in_progress',
    Empaquetado: 'to_pack',
    Auditado: 'audited',
    Embalado: 'packed',
    Rechazado: 'rejected_review',
    Despachado: 'dispatched',
  };
  return map[raw] ?? 'assigned';
}

/** Convierte un documento Firestore de lo_orders al tipo Order interno. */
// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
export function firestoreDocToOrder(id: string, data: Record<string, any>): Order {
  const lines: OrderLine[] = (data.original_skus ?? []).map(
    // biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
    (s: any): OrderLine => ({
      sku: s.sku ?? '',
      name: s.description ?? '',
      requiredQty: s.quantity ?? 0,
      unitsPerBundle: s.units_per_bundle ?? 1,
    }),
  );

  return {
    id,
    orderNumber: data.order_number ?? id,
    client: data.client_name ?? '',
    status: mapStatus(data.status ?? 'Asignado'),

    definedBultos: data.bundles_defined ?? 0,
    hasExtraBultos: data.extra_bundles_flag ?? false,
    bundlesCreated: data.bundles_created ?? 0,
    progressPercentage: data.progress_percentage ?? 0,
    lastSavedMilestone: 0,

    queuePosition: data.queue_position ?? 1,

    assignedPickerId: data.assigned_to?.uid ?? null,
    assignedLeadId: data.team?.chief_uid ?? null,
    teamId: null,

    lines,
    bultos: [],

    snapshotOriginal: null,
    finalSkus: [],
    auditObservations: [],

    createdAt: data.created_at ?? new Date().toISOString(),
    assignedAt: data.assigned_at ?? null,
    packedAt: data.packed_at ?? null,
  };
}
