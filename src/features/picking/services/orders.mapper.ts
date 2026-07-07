import type { FinalSku, Order, OrderLine, OrderStatus } from '../types';
import { reconstructBultosFromFinalSkus } from '../utils/order-snapshot';

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

// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function readUnitsPerBundle(data: Record<string, any>): number {
  const raw =
    data.units_per_bundle ??
    data.unidades_por_bulto ??
    data.cantidad_por_bulto ??
    data.qty_per_bundle;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function readFinalSkus(data: Record<string, any>): FinalSku[] {
  return (data.final_skus ?? []).map(
    // biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
    (s: any): FinalSku => ({
      originalSku: s.original_sku ?? '',
      originalQuantity: s.original_quantity ?? 0,
      packedSku: s.packed_sku ?? s.original_sku ?? '',
      packedQuantity: s.packed_quantity ?? 0,
      difference: s.difference ?? 0,
      substituted: Boolean(s.substituted),
      substitutionNote: s.substitution_note ?? null,
      bundles: (s.bundles ?? []).map(
        // biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
        (b: any) => ({
          bundleNum: b.bundle_num ?? 0,
          quantity: b.quantity ?? 0,
        }),
      ),
    }),
  );
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
      unitsPerBundle: readUnitsPerBundle(s),
      category: s.category ?? undefined,
      brand: s.brand ?? undefined,
      family: s.family ?? undefined,
    }),
  );

  const status = mapStatus(data.status ?? 'Asignado');
  const finalSkus = readFinalSkus(data);
  const hasPersistedPicking = finalSkus.some((sku) => sku.bundles.length > 0);
  const bultos = hasPersistedPicking
    ? reconstructBultosFromFinalSkus(id, finalSkus, lines)
    : [];
  const snapshotOriginal =
    hasPersistedPicking || status === 'in_progress' || status === 'rejected_review'
      ? lines.map((line) => ({ ...line }))
      : null;

  return {
    id,
    orderNumber: data.order_number ?? id,
    client: data.client_name ?? '',
    status,

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
    bultos,

    snapshotOriginal,
    finalSkus,
    auditObservations: [],

    createdAt: data.created_at ?? new Date().toISOString(),
    assignedAt: data.assigned_at ?? null,
    packedAt: data.packed_at ?? null,
  };
}
