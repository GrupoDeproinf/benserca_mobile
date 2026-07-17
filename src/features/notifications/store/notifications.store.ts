import { create } from 'zustand';
import { MOCK_NOTIFICATIONS } from '../data/mock-notifications';
import type { AppNotification, NotificationType, UserRole } from '@/shared/types';

let counter = 0;
function nextId(): string {
  return `notif-${Date.now()}-${++counter}`;
}

/** Incluye notificaciones del usuario y de su broadcast de rol. */
function matchesUser(n: AppNotification, userId: string, role?: UserRole): boolean {
  return (
    n.userId === userId ||
    (role !== undefined && n.userId === `broadcast-${role}`)
  );
}

interface NotificationsState {
  notifications: AppNotification[];
  // Selectores
  getForUser: (userId: string, role?: UserRole) => AppNotification[];
  getUnreadCount: (userId: string, role?: UserRole) => number;
  // Mutaciones
  add: (payload: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (notifId: string) => void;
  markAllRead: (userId: string, role?: UserRole) => void;
  /** Reemplaza las notificaciones de origen Firestore (con `firestoreId`), preservando las locales. */
  hydrateFirestoreNotifications: (incoming: AppNotification[]) => void;
  resetNotifications: () => void;
  /** Última notificación recién llegada (Firestore), para el banner global. `null` = no hay nada que mostrar. */
  incomingToast: AppNotification | null;
  showIncomingToast: (notification: AppNotification) => void;
  clearIncomingToast: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [...MOCK_NOTIFICATIONS],
  incomingToast: null,

  getForUser: (userId, role) =>
    get()
      .notifications.filter((n) => matchesUser(n, userId, role))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  getUnreadCount: (userId, role) =>
    get().notifications.filter((n) => matchesUser(n, userId, role) && !n.read).length,

  add: (payload) =>
    set((state) => ({
      notifications: [
        {
          ...payload,
          id: nextId(),
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    })),

  markRead: (notifId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notifId ? { ...n, read: true } : n,
      ),
    })),

  markAllRead: (userId, role) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        matchesUser(n, userId, role) ? { ...n, read: true } : n,
      ),
    })),

  hydrateFirestoreNotifications: (incoming) =>
    set((state) => ({
      notifications: [
        ...incoming,
        ...state.notifications.filter((n) => !n.firestoreId),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    })),

  resetNotifications: () =>
    set({ notifications: [...MOCK_NOTIFICATIONS] }),

  showIncomingToast: (notification) => set({ incomingToast: notification }),
  clearIncomingToast: () => set({ incomingToast: null }),
}));

/** Helper para disparar notificaciones desde acciones de dominio. */
export function notify(payload: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  orderId?: string;
}) {
  useNotificationsStore.getState().add(payload);
}
