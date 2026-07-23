import type { TFunction } from 'i18next';
import {
  AlertTriangle,
  Ban,
  Bell,
  ChevronRight,
  type LucideIcon,
  Package,
  PackageCheck,
  PackageSearch,
  PackageX,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Unlock,
  UserCheck,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppNotification, NotificationType } from '@/shared/types';

/** Ícono + color por tipo. Se reusa en el banner global de notificación entrante. */
export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { icon: LucideIcon; iconColor: string; iconBg: string }
> = {
  order_assigned: { icon: Package, iconColor: '#2563EB', iconBg: '#EFF6FF' },
  order_updated: { icon: RefreshCw, iconColor: '#0891B2', iconBg: '#ECFEFF' },
  order_recovered: { icon: RotateCcw, iconColor: '#7C3AED', iconBg: '#F5F3FF' },
  order_annulled: { icon: Ban, iconColor: '#6B7280', iconBg: '#F3F4F6' },
  picking_finished_incomplete: { icon: PackageX, iconColor: '#B45309', iconBg: '#FFFBEB' },
  picking_continued_with_mismatch: { icon: PackageSearch, iconColor: '#B45309', iconBg: '#FFFBEB' },
  order_audit_approved: { icon: PackageCheck, iconColor: '#059669', iconBg: '#ECFDF5' },
  order_audit_rejected: { icon: AlertTriangle, iconColor: '#DC2626', iconBg: '#FEF2F2' },
  team_released: { icon: Unlock, iconColor: '#7C3AED', iconBg: '#F5F3FF' },
  order_ready_to_audit: { icon: Search, iconColor: '#D97706', iconBg: '#FFFBEB' },
  team_member_done: { icon: UserCheck, iconColor: '#059669', iconBg: '#ECFDF5' },
  picker_idle: { icon: Pause, iconColor: '#6B7280', iconBg: '#F3F4F6' },
  order_paused: { icon: Pause, iconColor: '#B45309', iconBg: '#FFFBEB' },
  order_unpaused: { icon: Play, iconColor: '#059669', iconBg: '#ECFDF5' },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  titleRead: {
    fontWeight: '600',
    color: '#374151',
  },
  time: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 2,
    flexShrink: 0,
  },
  body: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  unreadBar: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: '#111827',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
});

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  showOrderLink?: boolean;
}

function formatTimeAgo(iso: string, t: TFunction): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('notifications.timeAgo.now');
  if (mins < 60) return t('notifications.timeAgo.minutes', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('notifications.timeAgo.hours', { count: hours });
  return t('notifications.timeAgo.days', { count: Math.floor(hours / 24) });
}

export function NotificationItem({
  notification,
  onPress,
  showOrderLink = false,
}: NotificationItemProps) {
  const { t } = useTranslation();
  const meta = NOTIFICATION_TYPE_META[notification.type] ?? {
    icon: Bell,
    iconColor: '#6B7280',
    iconBg: '#F3F4F6',
  };
  const Icon = meta.icon;
  const isUnread = !notification.read;
  const hasOrder = Boolean(notification.orderId && showOrderLink);

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}
    >
      <View style={styles.card}>
        <View style={{ flexDirection: 'row' }}>
          {isUnread ? <View style={styles.unreadBar} /> : null}
          <View style={[styles.inner, { flex: 1 }]}>
            <View style={[styles.iconBox, { backgroundColor: meta.iconBg }]}>
              <Icon size={20} color={meta.iconColor} strokeWidth={2} />
            </View>

            <View style={styles.content}>
              <View style={styles.topRow}>
                <Text style={[styles.title, !isUnread ? styles.titleRead : null]} numberOfLines={2}>
                  {notification.title}
                </Text>
                <Text style={styles.time}>{formatTimeAgo(notification.createdAt, t)}</Text>
              </View>
              <Text style={styles.body} numberOfLines={3}>
                {notification.body}
              </Text>
              {hasOrder ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 2,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827' }}>
                    {t('notifications.viewOrder')}
                  </Text>
                  <ChevronRight size={14} color="#111827" strokeWidth={2.5} />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
