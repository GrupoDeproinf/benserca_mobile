import { ClipboardList } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { ORDERS_LIST_CARD_GAP } from '@/features/picking/components/orders-list-page';
import { useAppTabBarHeight } from '@/features/tabs/hooks/use-app-tab-bar-height';
import { markNotificationRead } from '@/services/firebase/notifications.service';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { NotificationItem } from '../components/notification-item';
import { NOTIFICATIONS_HEADER_BG, NotificationsHeader } from '../components/notifications-header';
import { useNotificationPress } from '../hooks/use-notification-press';
import { useNotificationsStore } from '../store/notifications.store';

interface NotificationsScreenProps {
  /** Pantalla apilada (sin tab bar): muestra botón volver. */
  showBack?: boolean;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NOTIFICATIONS_HEADER_BG,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 8,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  countText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  markAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textDecorationLine: 'underline',
  },
});

export function NotificationsScreen({ showBack = false }: NotificationsScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const user = useCurrentUser();

  const allNotifications = useNotificationsStore((s) => s.notifications);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  const notifications = useMemo(() => {
    if (!user) return [];
    return allNotifications
      .filter(
        (n) => n.userId === user.uid || n.userId === `broadcast-${user.role}`,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [allNotifications, user]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const subtitle = useMemo(() => {
    if (unreadCount > 0) {
      return t('notifications.screen.unreadCount', { count: unreadCount });
    }
    return t('notifications.screen.allRead');
  }, [unreadCount, t]);

  const handlePress = useNotificationPress();

  const handleMarkAll = useCallback(() => {
    if (!user) return;
    markAllRead(user.uid, user.role);

    for (const n of notifications) {
      if (!n.firestoreId || n.read) continue;
      markNotificationRead(n.firestoreId, { uid: user.uid, name: user.name }).catch((e) =>
        console.error('[notifications.screen] markAll markNotificationRead error', e),
      );
    }
  }, [user, markAllRead, notifications]);

  const bottomPadding = showBack ? insets.bottom + 24 : tabBarHeight + 20;

  return (
    <View style={styles.root}>
      <NotificationsHeader
        title={t('notifications.screen.title')}
        subtitle={subtitle}
        showBack={showBack}
        onBack={() => router.back()}
        backLabel={t('common.back')}
      />

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: bottomPadding,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          notifications.length > 0 || unreadCount > 0 ? (
            <View style={styles.listHeader}>
              <View style={styles.countRow}>
                <ClipboardList size={18} color="#6B7280" strokeWidth={2} />
                <Text style={styles.countText} numberOfLines={1}>
                  {t('notifications.screen.listCount', { count: notifications.length })}
                </Text>
              </View>
              {unreadCount > 0 ? (
                <Pressable
                  onPress={handleMarkAll}
                  hitSlop={10}
                  accessibilityLabel={t('notifications.screen.markAll')}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Text style={styles.markAllLink}>{t('notifications.screen.markAll')}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={handlePress}
            showOrderLink={Boolean(item.orderId)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: ORDERS_LIST_CARD_GAP }} />}
        ListEmptyComponent={
          <EmptyState
            title={t('notifications.screen.emptyTitle')}
            description={t('notifications.screen.emptySubtitle')}
            className="mt-8"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
