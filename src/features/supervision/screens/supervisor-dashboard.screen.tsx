import { useRouter } from 'expo-router';
import {
  FilePlus2,
  Package,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { OrderStatus } from '@/features/picking/types';
import { useAppTabBarHeight } from '@/features/tabs/hooks/use-app-tab-bar-height';
import {
  countOrdersByStatus,
  SECTION_ICON,
  STATUS_CARD_ORDER,
  STATUS_SECTION_ORDER,
  type StatusSection,
  type StatusTileTone,
} from '../utils/order-status-summary';

const H_PADDING = 16;
const GRID_GAP = 12;
const SCREEN_W = Dimensions.get('window').width;
const TILE_W = Math.floor((SCREEN_W - H_PADDING * 2 - GRID_GAP) / 2);

const SECTION_TITLE_KEY: Record<StatusSection, string> = {
  enCurso: 'supervisorAlmacen.dashboard.sections.enCurso',
  chequeo: 'supervisorAlmacen.dashboard.sections.chequeo',
};

const TONE_STYLE: Record<
  StatusTileTone,
  { bg: string; border: string; iconBg: string; icon: string; value: string }
> = {
  neutral: {
    bg: '#FFFFFF',
    border: '#E5E5EA',
    iconBg: '#F3F4F6',
    icon: '#4B5563',
    value: '#111827',
  },
  danger: {
    bg: '#FEE2E2',
    border: '#FECACA',
    iconBg: '#FFFFFF',
    icon: '#DC2626',
    value: '#B91C1C',
  },
  success: {
    bg: '#DCFCE7',
    border: '#BBF7D0',
    iconBg: '#FFFFFF',
    icon: '#16A34A',
    value: '#15803D',
  },
};

interface StatusTileProps {
  label: string;
  count: number;
  icon: LucideIcon;
  tone: StatusTileTone;
  onPress: () => void;
}

function StatusTile({ label, count, icon: Icon, tone, onPress }: StatusTileProps) {
  const colors = TONE_STYLE[tone];
  const muted = count === 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${count}`}
      style={({ pressed }) => [pressed && { opacity: 0.88 }]}
    >
      <View
        style={[
          styles.tile,
          {
            width: TILE_W,
            backgroundColor: colors.bg,
            borderColor: colors.border,
            opacity: muted ? 0.55 : 1,
          },
        ]}
      >
        <View style={styles.tileTop}>
          <View style={[styles.tileIconBadge, { backgroundColor: colors.iconBg }]}>
            <Icon size={18} color={colors.icon} strokeWidth={2.4} />
          </View>
          <Text style={styles.tileLabel} numberOfLines={2}>
            {label}
          </Text>
        </View>
        <Text style={[styles.tileValue, { color: colors.value }]}>{count}</Text>
      </View>
    </Pressable>
  );
}

function RefreshButton({ onPress, label }: { onPress: () => void; label: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!busy) {
      spin.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    const timer = setTimeout(() => {
      anim.stop();
      setBusy(false);
      spin.setValue(0);
    }, 900);
    return () => {
      anim.stop();
      clearTimeout(timer);
    };
  }, [busy, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Pressable
      onPress={() => {
        if (busy) return;
        setBusy(true);
        onPress();
      }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.refreshBtn, pressed && styles.refreshBtnPressed]}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <RefreshCw size={16} color="#FFFFFF" strokeWidth={2.4} />
      </Animated.View>
      <Text style={styles.refreshLabel}>{label}</Text>
    </Pressable>
  );
}

export function SupervisorDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const tabBarHeight = useAppTabBarHeight();
  const orders = useOrdersStore((s) => s.orders);

  const counts = useMemo(() => countOrdersByStatus(orders), [orders]);
  const total = orders.length;

  const goToStatus = (status: OrderStatus) => {
    router.push(`/(app)/supervisor-almacen/status/${status}` as never);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('supervisorAlmacen.dashboard.title')}</Text>
        <RefreshButton
          label={t('supervisorAlmacen.dashboard.refresh')}
          onPress={() => {
            /* Los pedidos ya llegan en vivo por el listener; esto da feedback visual. */
          }}
        />
      </View>

      <View style={styles.kpiCard}>
        <View style={styles.kpiCell}>
          <View style={[styles.kpiIconBadge, { backgroundColor: '#F3F4F6' }]}>
            <Package size={18} color="#374151" strokeWidth={2.2} />
          </View>
          <Text style={styles.kpiLabel}>{t('supervisorAlmacen.dashboard.totalOrders')}</Text>
          <Text style={styles.kpiValue}>{total}</Text>
        </View>
        <View style={styles.kpiDivider} />
        <Pressable style={styles.kpiCell} onPress={() => goToStatus('new')}>
          <View style={[styles.kpiIconBadge, { backgroundColor: '#F3F4F6' }]}>
            <FilePlus2 size={18} color="#374151" strokeWidth={2.2} />
          </View>
          <Text style={styles.kpiLabel}>{t('supervisorAlmacen.dashboard.newUnassigned')}</Text>
          <Text style={styles.kpiValue}>{counts.new}</Text>
        </Pressable>
      </View>

      {STATUS_SECTION_ORDER.map((section) => {
        const items = STATUS_CARD_ORDER.filter((m) => m.section === section);
        const SectionIcon = SECTION_ICON[section];

        return (
          <View key={section} style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <SectionIcon size={16} color="#2563EB" strokeWidth={2.2} />
              <Text style={styles.sectionTitle}>{t(SECTION_TITLE_KEY[section])}</Text>
            </View>

            <View style={styles.tilesRow}>
              {items.map((meta, index) => (
                <View
                  key={meta.status}
                  style={{ marginRight: index % 2 === 0 ? GRID_GAP : 0 }}
                >
                  <StatusTile
                    label={t(meta.labelKey)}
                    count={counts[meta.status]}
                    icon={meta.icon}
                    tone={meta.tone}
                    onPress={() => goToStatus(meta.status)}
                  />
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingHorizontal: H_PADDING, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 16,
    paddingTop: 4,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 34,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshBtnPressed: {
    backgroundColor: '#374151',
  },
  refreshLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiCell: { flex: 1 },
  kpiDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 14,
  },
  kpiIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
  },
  kpiValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 34,
    marginTop: 2,
  },
  sectionBlock: { marginTop: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    minHeight: 118,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    marginBottom: GRID_GAP,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tileIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tileLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    lineHeight: 16,
  },
  tileValue: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
});
