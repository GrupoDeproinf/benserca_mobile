import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { markNotificationRead } from '@/services/firebase/notifications.service';
import type { AppNotification } from '@/shared/types';
import { useNotificationsStore } from '../store/notifications.store';
import { getNotificationOrderHref } from '../utils/notification-navigation';

/**
 * Qué pasa al tocar una notificación (desde la lista o el banner global):
 * marcar leída (local + Firestore si aplica) y navegar al pedido si se puede
 * resolver un id local (directo, o buscando por `orderNumber` en el store).
 */
export function useNotificationPress() {
  const router = useRouter();
  const user = useCurrentUser();
  const markRead = useNotificationsStore((s) => s.markRead);

  return useCallback(
    (notification: AppNotification) => {
      markRead(notification.id);
      if (notification.firestoreId && user) {
        markNotificationRead(notification.firestoreId, { uid: user.uid, name: user.name }).catch(
          (e) => console.error('[notifications] markNotificationRead error', e),
        );
      }

      if (!user?.role) return;

      const orderId =
        notification.orderId ??
        (notification.orderNumber != null
          ? useOrdersStore
              .getState()
              .orders.find((o) => Number(o.orderNumber) === notification.orderNumber)?.id
          : undefined);
      if (!orderId) return;

      const href = getNotificationOrderHref(user.role, orderId);
      if (href) router.push(href as never);
    },
    [markRead, user, router],
  );
}
