// ───────── Pedido ─────────
export type OrderStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'to_pack'
  | 'packed'
  | 'rejected_review'
  | 'audited'
  | 'dispatched';

/** SKU del pedido tal como llega de Profit (referencia, lo que se DEBE pickear). */
export interface OrderLine {
  sku: string;
  name: string;
  requiredQty: number;
  unitsPerBundle: number;
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
  /** Unidades por bulto del SKU empaquetado (sustituto). */
  unitsPerBundle?: number;
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
  teamId: string | null;

  lines: OrderLine[];
  bultos: Bulto[];

  snapshotOriginal: OrderLine[] | null;
  finalSkus: FinalSku[];

  auditObservations: AuditObservation[];

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
  | 'approve_audit'
  | 'reject_audit'
  | 'reopen_for_revision';

export type PickerActionError =
  | 'not_queue_head'
  | 'already_active_order'
  | 'empty_open_bulto_exists'
  | 'cannot_close_empty_bulto';
