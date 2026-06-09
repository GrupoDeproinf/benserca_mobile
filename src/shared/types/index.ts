// ───────── Roles & sesión ─────────
export type UserRole = 'picker' | 'warehouse_lead' | 'auditor' | 'supervisor';

export interface SessionUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

// ───────── Notificaciones in-app ─────────
export type NotificationType =
  | 'order_assigned'
  | 'order_rejected'
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
  orderId?: string;
  read: boolean;
  createdAt: string;
}
