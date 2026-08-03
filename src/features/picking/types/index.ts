import type { UserRole } from '@/shared/types';

// ───────── Pedido ─────────
export type OrderStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'to_pack'
  | 'packed'
  | 'rejected_review'
  | 'audited'
  | 'dispatched'
  | 'annulled'
  | 'recovered';

/** SKU del pedido tal como llega de Profit (referencia, lo que se DEBE pickear). */
export interface OrderLine {
  sku: string;
  name: string;
  requiredQty: number;
  /**
   * Talla del artículo (ej. cascos S/M/L). Es el "gate" de sustitución:
   * si no viene, el artículo NO es sustituible.
   */
  talla?: string;
  /** Categoría Profit (`co_cat`). Filtro de candidatos de sustitución. */
  coCat?: string;
  /** Sublínea Profit (`co_subl`). Filtro de candidatos de sustitución. */
  coSubl?: string;
  category?: string;
  brand?: string;
  family?: string;
}

/** Ítem metido en un bulto por el picker. */
export interface BultoItem {
  id: string;
  /** SKU realmente empaquetado. */
  sku: string;
  name: string;
  qty: number;
  /** SKU original del pedido si hubo sustitución. */
  originalSku?: string;
  substitutionNote?: string;
}

export type BultoStatus = 'open' | 'closed';

export interface Bulto {
  id: string;
  number: number;
  status: BultoStatus;
  items: BultoItem[];
}

export interface FinalSkuBundle {
  bundleNum: number;
  quantity: number;
}

/** Estado final por SKU original (schema Firestore). */
export interface FinalSku {
  originalSku: string;
  originalQuantity: number;
  packedSku: string;
  packedQuantity: number;
  difference: number;
  substituted: boolean;
  substitutionNote: string | null;
  bundles: FinalSkuBundle[];
}

/** Observación obligatoria que deja el auditor al rechazar. */
export interface AuditObservation {
  id: string;
  auditorId: string;
  auditorName: string;
  text: string;
  createdAt: string;
}

/** Motivo de la pausa de picking. */
export type PauseReason = 'falta_articulo' | 'cambio_prioridad';

/**
 * Entrada del historial de eventos del pedido (`timeline` en Firestore). Es
 * append-only: cada transición (incl. pausa/despausa) hace push de una entrada.
 * Para la pausa se aprovechan los campos extra `reason` / `missingSkus`.
 */
export interface TimelineEntry {
  /** Estatus asociado al evento. La pausa usa `'Pausa'`; la despausa el operativo. */
  status: string;
  timestamp: string;
  userUid: string;
  userName: string;
  userRole?: UserRole;
  note?: string | null;
  /** Solo en la entrada de pausa. */
  reason?: PauseReason;
  /** Solo en la entrada de pausa con `reason === 'falta_articulo'`. */
  missingSkus?: string[];
}

/**
 * Vista derivada de la pausa activa. NO se persiste como objeto propio: se
 * calcula en el mapper a partir de la última entrada de `timeline` con
 * `status === 'Pausa'` (mientras `isPaused` sea true). La pausa no cambia el
 * `status` del pedido.
 */
export interface PauseInfo {
  reason: PauseReason;
  /** SKUs marcados como faltantes; solo aplica si `reason === 'falta_articulo'`. */
  missingSkus: string[];
  authorId: string;
  authorName: string;
  authorRole?: UserRole;
  createdAt: string;
  note?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  client: string;
  status: OrderStatus;

  isCritical?: boolean;

  definedBultos: number;
  hasExtraBultos: boolean;
  bundlesCreated: number;
  progressPercentage: number;
  /** Último hito de guardado parcial alcanzado (0, 25, 50, 75, 100). */
  lastSavedMilestone: number;

  /** Posición en cola del picker (1 = puede iniciar). */
  queuePosition: number;

  assignedPickerId: string | null;
  assignedLeadId: string | null;
  /** `team.picker_uids` en Firestore: pickers del equipo armado para este pedido. */
  teamPickerUids: string[];

  lines: OrderLine[];
  bultos: Bulto[];

  snapshotOriginal: OrderLine[] | null;
  finalSkus: FinalSku[];

  auditObservations: AuditObservation[];
  /** Resultado de la última auditoría (`audit.result` en Firestore). */
  auditResult: 'approved' | 'rejected' | null;
  /**
   * Números de bulto que el chequeador rechazó (`audit.rejected_bundles`).
   * Se vacía al aprobar el pedido.
   */
  rejectedBundles: number[];
  /**
   * Números de bulto que el chequeador aprobó (`audit.approved_bundles`). Es lo
   * que se le OCULTA al picker al corregir, para que no dañe lo ya aprobado.
   * Se guarda esta lista y no solo la de rechazados porque un bulto que el
   * picker abra durante la corrección no está en ninguna de las dos: al no
   * estar aprobado, sigue visible aunque lo cierre.
   */
  approvedBundles: number[];

  /** Pausa activa del picking. No cambia `status`; es un flag ortogonal. */
  isPaused: boolean;
  pauseInfo: PauseInfo | null;

  createdAt: string;
  assignedAt: string | null;
  packedAt: string | null;
}

// ───────── Equipos ─────────
export type TeamStatus = 'active' | 'released';

export interface Team {
  id: string;
  orderId: string;
  leadId: string;
  pickerIds: string[];
  status: TeamStatus;
  createdAt: string;
}

/** Acciones de dominio que la UI puede ofrecer según estatus y rol. */
export type OrderDomainAction =
  | 'start_picking'
  | 'open_bulto'
  | 'finish_picking'
  | 'mark_wrapped'
  | 'mark_dispatched'
  | 'approve_audit'
  | 'reject_audit'
  | 'reopen_for_revision'
  | 'pause_picking'
  | 'resume_picking';

export type PickerActionError =
  | 'already_active_order'
  | 'empty_open_bulto_exists'
  | 'cannot_close_empty_bulto'
  | 'no_bultos';
