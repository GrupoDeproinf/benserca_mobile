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
}

/** Ítem realmente metido dentro de un bulto por el picker. */
export interface BultoItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
}

export type BultoStatus = 'open' | 'closed';

export interface Bulto {
  id: string;
  number: number;
  status: BultoStatus;
  items: BultoItem[];
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

  /** Prioridad visual en listas (ej. pedidos urgentes en cola). */
  isCritical?: boolean;

  definedBultos: number;
  hasExtraBultos: boolean;

  assignedPickerId: string | null;
  assignedLeadId: string | null;
  teamId: string | null;

  lines: OrderLine[];
  bultos: Bulto[];

  snapshotOriginal: OrderLine[] | null;
  finalState: BultoItem[] | null;

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
  | 'mark_packed'
  | 'approve_audit'
  | 'reject_audit'
  | 'reopen_for_revision';
