import { useRouter } from 'expo-router';
import {
  Box,
  Calendar,
  ChevronRight,
  Clock,
  Package,
  ShoppingCart,
  User,
  Users2,
  type LucideIcon,
} from 'lucide-react-native';
import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import type { Order } from '../types';
import { formatAssignedDate } from '../utils/format-assigned-date';
import { ORDER_STATUS_I18N_KEY } from '../utils/order-status';
import { computePickingProgress } from '../utils/order-progress';
import { formatTimeInQueue } from '../utils/time-in-queue';
import { CircularProgress } from './circular-progress';

type OrdersListCardVariant = 'picker' | 'lead';

const META_ICON_SIZE = 18;
const META_PROGRESS_SIZE = 40;

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
  iconBox: {
    width: 40,
    height: 44,
    borderRadius: 11,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: '#8E8E93',
    lineHeight: 14,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 15,
    marginTop: 2,
  },
  progressLabel: {
    flex: 1,
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  iconBoxLarge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
});

interface MetaBlockProps {
  icon: ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}

function MetaBlock({ icon, label, value, valueColor = '#111827' }: MetaBlockProps) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
      <View style={styles.iconBox}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <Text style={styles.metaLabel} numberOfLines={2}>
          {label}
        </Text>
        <Text style={[styles.metaValue, { color: valueColor }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

interface OrdersListCardProps {
  order: Order;
  href: string;
  variant: OrdersListCardVariant;
  hasTeam?: boolean;
  teamMemberCount?: number;
}

const CARD_BADGE: Partial<Record<Order['status'], { bg: string; text: string; labelKey: string }>> = {
  assigned: { bg: '#FEF3C7', text: '#B45309', labelKey: 'picking.card.statusPending' },
  in_progress: { bg: '#D1FAE5', text: '#059669', labelKey: 'picking.card.statusPicking' },
  to_pack: { bg: '#E0E7FF', text: '#4338CA', labelKey: 'orderStatus.toPack' },
  rejected_review: { bg: '#FEE2E2', text: '#B91C1C', labelKey: 'orderStatus.rejectedReview' },
  audited: { bg: '#DCFCE7', text: '#15803D', labelKey: 'orderStatus.approved' },
  packed: { bg: '#DCFCE7', text: '#15803D', labelKey: 'orderStatus.packed' },
  dispatched: { bg: '#DBEAFE', text: '#1D4ED8', labelKey: 'orderStatus.dispatched' },
};

function PickerProcessBlock({ order, t }: { order: Order; t: TFunction }) {
  if (order.status !== 'in_progress') {
    return (
      <MetaBlock
        icon={<Package size={META_ICON_SIZE} color="#6B7280" strokeWidth={2} />}
        label={t('picking.card.process')}
        value={
          order.status === 'to_pack'
            ? t('picking.card.pickingDone')
            : order.status === 'rejected_review'
              ? t('picking.card.needsReview')
              : order.status === 'assigned'
                ? t('picking.card.notStarted')
                : t(ORDER_STATUS_I18N_KEY[order.status])
        }
      />
    );
  }

  const progress = computePickingProgress(order);
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8, minWidth: 0, paddingTop: 1 }}>
      <CircularProgress progress={progress} size={META_PROGRESS_SIZE} color="#10B981" />
      <Text style={styles.progressLabel} numberOfLines={2}>
        {t('picking.card.progress')}
      </Text>
    </View>
  );
}

function LeadProcessBlock({ order, t }: { order: Order; t: TFunction }) {
  const progress = computePickingProgress(order);

  if (order.status === 'in_progress') {
    return (
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8, minWidth: 0, paddingTop: 1 }}>
        <CircularProgress progress={progress} size={META_PROGRESS_SIZE} color="#10B981" />
        <Text style={styles.progressLabel} numberOfLines={2}>
          {t('picking.card.progress')}
        </Text>
      </View>
    );
  }

  let statusText = t('picking.card.notStarted');
  if (order.status === 'to_pack') statusText = t('picking.card.pickingDone');
  else if (order.status === 'rejected_review') statusText = t('picking.card.needsReview');
  else if (order.status === 'assigned') statusText = t('picking.card.statusPending');

  return (
    <MetaBlock
      icon={<Package size={META_ICON_SIZE} color="#6B7280" strokeWidth={2} />}
      label={t('picking.card.process')}
      value={statusText}
    />
  );
}

function PickerCardFooter({ order, t }: { order: Order; t: TFunction }) {
  return (
    <>
      <MetaBlock
        icon={<Box size={META_ICON_SIZE} color="#6B7280" strokeWidth={2} />}
        label={t('picking.card.definedBultos')}
        value={String(order.definedBultos)}
      />
      <PickerProcessBlock order={order} t={t} />
      <MetaBlock
        icon={<Calendar size={META_ICON_SIZE} color="#6B7280" strokeWidth={2} />}
        label={t('picking.card.assignedAt')}
        value={formatAssignedDate(order.assignedAt)}
      />
    </>
  );
}

function LeadCardFooter({
  order,
  t,
  hasTeam,
  teamMemberCount,
}: {
  order: Order;
  t: TFunction;
  hasTeam?: boolean;
  teamMemberCount: number;
}) {
  const queueTime = formatTimeInQueue(order.assignedAt ?? order.createdAt);
  const AssigneeIcon: LucideIcon = hasTeam ? Users2 : User;
  const assigneeLabel = hasTeam
    ? t('teams.card.teamCount', { count: teamMemberCount })
    : t('picking.card.unassigned');

  return (
    <>
      <MetaBlock
        icon={<AssigneeIcon size={META_ICON_SIZE} color="#6B7280" strokeWidth={2} />}
        label={t('teams.card.teamLabel')}
        value={assigneeLabel}
      />
      <LeadProcessBlock order={order} t={t} />
      <MetaBlock
        icon={<Clock size={META_ICON_SIZE} color="#6B7280" strokeWidth={2} />}
        label={t('picking.card.timeInQueue')}
        value={queueTime.label}
        valueColor={queueTime.color}
      />
    </>
  );
}

export function OrdersListCard({
  order,
  href,
  variant,
  hasTeam,
  teamMemberCount = 0,
}: OrdersListCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  // El estatus "audited" solo cubre el resultado aprobado por diseño (un rechazo
  // pasa a "rejected_review"), pero se apoya en audit.result como fuente de
  // verdad en vez de asumirlo por el status.
  const badge =
    order.status === 'audited' && order.auditResult === 'rejected'
      ? CARD_BADGE.rejected_review
      : CARD_BADGE[order.status];

  return (
    <Pressable
      onPress={() => router.push(href as never)}
      style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
    >
      <View style={styles.card}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 14,
            gap: 12,
            backgroundColor: '#FFFFFF',
          }}
        >
          <View style={styles.iconBoxLarge}>
            <ShoppingCart size={20} color="#6B7280" strokeWidth={2} />
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
                {order.orderNumber}
              </Text>
              {variant === 'lead' && order.isCritical ? (
                <View
                  style={{
                    backgroundColor: '#FEE2E2',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#DC2626', letterSpacing: 0.5 }}>
                    {t('picking.card.critical')}
                  </Text>
                </View>
              ) : null}
              {order.hasExtraBultos ? (
                <View
                  style={{
                    backgroundColor: '#FEF3C7',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#B45309' }}>
                    {t('picking.card.extraBultos')}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
              {t('picking.card.client')}: {order.client}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {badge ? (
              <View
                style={{
                  backgroundColor: badge.bg,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 20,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: badge.text }}>
                  {t(badge.labelKey)}
                </Text>
              </View>
            ) : null}
            <ChevronRight size={18} color="#C7C7CC" strokeWidth={2} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          {variant === 'picker' ? (
            <PickerCardFooter order={order} t={t} />
          ) : (
            <LeadCardFooter
              order={order}
              t={t}
              hasTeam={hasTeam}
              teamMemberCount={teamMemberCount}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}
