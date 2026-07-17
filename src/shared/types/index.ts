// ───────── Roles & sesión ─────────
export type UserRole =
  | 'picker'
  | 'warehouse_lead'
  | 'auditor'
  | 'supervisor_almacen';

export interface SessionUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

// ───────── Notificaciones (Firestore `notifications` + locales de la app) ─────────
/**
 * Catálogo de tipos compartido con la web (ver notifications.md), más los
 * tipos locales que solo existen dentro de la app móvil (team_*, picker_idle,
 * order_ready_to_audit: cola interna del chequeador, no viaja a Firestore).
 *
 * `order_audit_approved` / `order_audit_rejected` son tipos NUEVOS (no están
 * en el catálogo original del doc): cubren la aprobación/rechazo del
 * chequeador sobre un pedido empaquetado, evento que el doc no contempla.
 */
export type NotificationType =
  // Compartidos con Firestore `notifications` (creados por web/Profit, solo lectura en la app)
  | 'order_assigned'
  | 'order_updated'
  | 'order_recovered'
  | 'order_annulled'
  // Compartidos con Firestore `notifications` (creados por la app)
  | 'picking_finished_incomplete'
  | 'picking_continued_with_mismatch'
  | 'order_audit_approved'
  | 'order_audit_rejected'
  // Locales, solo dentro de la app móvil
  | 'team_released'
  | 'order_ready_to_audit'
  | 'team_member_done'
  | 'picker_idle';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Id local del pedido (`lo_orders` doc id) para notificaciones locales. */
  orderId?: string;
  /** Número de pedido (`order_number`) tal como viene en el doc de Firestore. */
  orderNumber?: number;
  read: boolean;
  createdAt: string;
  /** Id del doc en la colección `notifications` de Firestore, si vino de ahí. */
  firestoreId?: string;
}
