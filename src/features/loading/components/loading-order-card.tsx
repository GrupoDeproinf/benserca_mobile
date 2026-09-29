import { useRouter } from 'expo-router';
import { Box, ChevronRight, Truck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { CircularProgress } from '@/features/picking/components/circular-progress';
import type { Order } from '@/features/picking/types';
import { PAUSED_BADGE_STYLE, PAUSED_STATUS_I18N_KEY } from '@/features/picking/utils/order-status';
import { Text } from '@/shared/components/ui/text';
import { getLoadingProgress } from '../utils/loading-progress';

interface LoadingOrderCardProps {
  order: Order;
}

/** Pedido embalado en la lista del cargador: cuántos bultos van en el camión. */
export function LoadingOrderCard({ order }: LoadingOrderCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const progress = getLoadingProgress(order);

  return (
    <Pressable
      onPress={() => router.push(`/(app)/cargador/order/${order.id}` as never)}
      style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
    >
      <View style={[styles.card, progress.complete && styles.cardComplete]}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Truck size={20} color="#6B7280" strokeWidth={2} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.titleRow}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              {order.isPaused ? (
                <View style={[styles.badge, { backgroundColor: PAUSED_BADGE_STYLE.bg }]}>
                  <Text style={[styles.badgeText, { color: PAUSED_BADGE_STYLE.text }]}>
                    {t(PAUSED_STATUS_I18N_KEY)}
                  </Text>
                </View>
              ) : progress.complete ? (
                <View style={[styles.badge, styles.badgeReady]}>
                  <Text style={[styles.badgeText, styles.badgeReadyText]}>
                    {t('loading.card.readyBadge')}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.client} numberOfLines={1}>
              {t('loading.card.client')}: {order.client}
            </Text>
          </View>
          <ChevronRight size={18} color="#C7C7CC" strokeWidth={2} />
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.metaBlock}>
            <View style={styles.metaIconBox}>
              <Box size={18} color="#6B7280" strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.metaLabel}>{t('loading.card.bultos')}</Text>
              <Text style={styles.metaValue}>{progress.total}</Text>
            </View>
          </View>
          <View style={styles.metaBlock}>
            <CircularProgress
              progress={progress.total > 0 ? progress.loaded / progress.total : 0}
              size={40}
              color="#16A34A"
            />
            <View>
              <Text style={styles.metaLabel}>{t('loading.card.loaded')}</Text>
              <Text style={styles.metaValue}>
                {progress.loaded}/{progress.total}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  cardComplete: {
    borderColor: '#16A34A',
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  orderNumber: { fontSize: 16, fontWeight: '800', color: '#111827' },
  client: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  badgeReady: { backgroundColor: '#DCFCE7' },
  badgeReadyText: { color: '#15803D' },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 16,
  },
  metaBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaIconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: { fontSize: 11, color: '#8E8E93' },
  metaValue: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 1 },
});
