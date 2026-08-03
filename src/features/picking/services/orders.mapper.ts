import type { FinalSku, Order, OrderLine, OrderStatus, PauseInfo } from '../types';
import { reconstructBultosFromFinalSkus } from '../utils/order-snapshot';

/**
 * Normaliza una fecha de Firestore (Timestamp, epoch en ms o string) a ISO.
 * Devuelve null si no hay valor o si no es parseable, para que quien consuma
 * el campo pueda distinguir "sin fecha" de una fecha real.
 */
// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function readTimestampOrNull(value: any): string | null {
  if (value == null) return null;
  // Firestore Timestamp
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

/**
 * Igual que `readTimestampOrNull`, pero siempre devuelve un string. Un valor
 * ilegible se conserva tal cual en vez de inventarle la fecha de hoy: es
 * preferible que quede visible como dato raro a que un pedido viejo aparezca
 * como creado ahora mismo.
 */
// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function readTimestamp(value: any): string {
  const iso = readTimestampOrNull(value);
  if (iso) return iso;
  return typeof value === 'string' && value.length > 0 ? value : new Date().toISOString();
}

/**
 * Deriva la pausa activa desde el `timeline`: última entrada con
 * `status === 'Pausa'`. Se usa solo cuando `is_paused` es true; si el pedido se
 * despausó, esa entrada queda como histórico y no se muestra.
 */
// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function derivePauseInfo(timeline: any[]): PauseInfo | null {
  for (let i = timeline.length - 1; i >= 0; i--) {
    const entry = timeline[i];
    if (entry?.status === 'Pausa') {
      return {
        reason: entry.reason ?? 'cambio_prioridad',
        missingSkus: Array.isArray(entry.missing_skus) ? entry.missing_skus : [],
        authorId: entry.user_uid ?? '',
        authorName: entry.user_name ?? '',
        authorRole: entry.user_role ?? undefined,
        createdAt: readTimestamp(entry.timestamp ?? entry.at),
        note: entry.note ?? null,
      };
    }
  }
  return null;
}

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
    Anulado: 'annulled',
    Recuperado: 'recovered',
  };
  return map[raw] ?? 'assigned';
}

/**
 * Cantidad pedida. Profit la manda como string decimal ("1.00000"), y sin
 * convertirla se vería "×1.00000" en pantalla y cualquier suma la concatenaría
 * en vez de sumarla.
 */
// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function readQuantity(value: any): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function readTalla(data: Record<string, any>): string | undefined {
  const raw = data.talla;
  const s = typeof raw === 'string' ? raw.trim() : raw != null ? String(raw).trim() : '';
  return s.length > 0 ? s : undefined;
}

/**
 * `co_cat` / `co_subl` se conservan SIN recortar: en Profit vienen con espacios
 * finales (ej. "ACCE ") y deben coincidir exactamente con los del catálogo
 * `articulos` para el filtro de sustitución.
 */
// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function readRawString(value: any): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Lista de números de bulto de la auditoría, ignorando valores no numéricos. */
// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function readBundleNumbers(value: any): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((n): n is number => typeof n === 'number');
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
      // Los pedidos reales traen `descriptions` (plural) aunque el schema
      // documenta `description`: se aceptan las dos para no dejar el nombre
      // en blanco según de qué importación venga el pedido.
      name: s.description ?? s.descriptions ?? '',
      requiredQty: readQuantity(s.quantity),
      talla: readTalla(s),
      coCat: readRawString(s.co_cat),
      coSubl: readRawString(s.co_subl),
      category: s.category ?? undefined,
      brand: s.brand ?? undefined,
      family: s.family ?? undefined,
    }),
  );

  const status = mapStatus(data.status ?? 'Asignado');
  const timeline = Array.isArray(data.timeline) ? data.timeline : [];
  const isPaused = data.is_paused ?? false;
  const finalSkus = readFinalSkus(data);
  const hasPersistedPicking = finalSkus.some((sku) => sku.bundles.length > 0);
  const bultos = hasPersistedPicking ? reconstructBultosFromFinalSkus(id, finalSkus, lines) : [];
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
    teamPickerUids: Array.isArray(data.team?.picker_uids) ? data.team.picker_uids : [],

    lines,
    bultos,

    snapshotOriginal,
    finalSkus,
    auditObservations: [],
    auditResult: data.audit?.result ?? null,
    rejectedBundles: readBundleNumbers(data.audit?.rejected_bundles),
    approvedBundles: readBundleNumbers(data.audit?.approved_bundles),

    isPaused,
    pauseInfo: isPaused ? derivePauseInfo(timeline) : null,

    // Se normalizan a ISO: en Firestore estos campos pueden venir como
    // Timestamp, y un Timestamp crudo rompe cualquier `new Date(...)` posterior
    // (orden por fecha, filtros, tiempo en cola).
    createdAt: readTimestamp(data.created_at),
    assignedAt: readTimestampOrNull(data.assigned_at),
    // "Empaquetado" = picker finalizó el picking; ese es el timestamp que se muestra.
    packedAt: readTimestampOrNull(data.picking_finished_at ?? data.packed_at),
  };
}
