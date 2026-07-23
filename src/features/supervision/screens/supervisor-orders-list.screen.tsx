import { useRouter } from 'expo-router';
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrdersListCard } from '@/features/picking/components/orders-list-card';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { Order, OrderStatus } from '@/features/picking/types';
import { ORDER_STATUS_I18N_KEY } from '@/features/picking/utils/order-status';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { FilterDropdown } from '@/shared/components/ui/filter-dropdown';
import { Text } from '@/shared/components/ui/text';
import { useSupervisorOrdersRefresh } from '../hooks/use-supervisor-orders-refresh';

type DatePreset = 'all' | 'today' | 'week' | 'month';

const DATE_PRESETS: { value: DatePreset; labelKey: string }[] = [
  { value: 'all', labelKey: 'supervisorAlmacen.filter.dateAll' },
  { value: 'today', labelKey: 'supervisorAlmacen.filter.dateToday' },
  { value: 'week', labelKey: 'supervisorAlmacen.filter.dateWeek' },
  { value: 'month', labelKey: 'supervisorAlmacen.filter.dateMonth' },
];

function datePresetThreshold(preset: DatePreset): number | null {
  if (preset === 'all') return null;
  const now = new Date();
  if (preset === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  const days = preset === 'week' ? 7 : 30;
  return now.getTime() - days * 24 * 60 * 60 * 1000;
}

export type SupervisorOrdersListMode =
  | { type: 'status'; status: OrderStatus }
  | { type: 'paused' };

interface SupervisorOrdersListScreenProps {
  mode: SupervisorOrdersListMode;
}

const ALL_PICKERS = '__all__';
const UNASSIGNED = '__unassigned__';

export function SupervisorOrdersListScreen({ mode }: SupervisorOrdersListScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const orders = useOrdersStore((s) => s.orders);
  const pickers = usePickersStore((s) => s.pickers);

  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [pickerId, setPickerId] = useState<string>(ALL_PICKERS);
  const { refreshing, refresh } = useSupervisorOrdersRefresh();

  const filtered = useMemo<Order[]>(() => {
    const threshold = datePresetThreshold(datePreset);
    return orders.filter((o) => {
      if (mode.type === 'status') {
        if (o.status !== mode.status) return false;
      } else if (!o.isPaused) {
        return false;
      }

      if (threshold != null) {
        // Misma referencia que el "hace X" de la card (tiempo en cola): filtrar
        // por created_at hacía que un pedido viejo asignado hoy no apareciera
        // en "Hoy" aunque la card mostrara pocas horas.
        const ref = new Date(o.assignedAt ?? o.createdAt).getTime();
        // Fecha ilegible → no se oculta el pedido; desaparecer en silencio es
        // peor que colarse en un rango.
        if (Number.isFinite(ref) && ref < threshold) return false;
      }

      if (pickerId === UNASSIGNED) {
        if (o.assignedPickerId) return false;
      } else if (pickerId !== ALL_PICKERS) {
        if (o.assignedPickerId !== pickerId) return false;
      }

      return true;
    });
  }, [orders, mode, datePreset, pickerId]);

  const statusLabel =
    mode.type === 'status' ? t(ORDER_STATUS_I18N_KEY[mode.status]) : t('supervisorAlmacen.paused.title');

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <View style={[styles.blackBand, { paddingTop: insets.top + 2 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityLabel={t('common.back')}
          >
            <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>{statusLabel}</Text>
          <Text style={styles.headerCount}>
            {t('supervisorAlmacen.list.count', { count: filtered.length })}
          </Text>
        </View>

        <View style={styles.filterBar}>
          <FilterDropdown
            style={styles.filterItem}
            icon={CalendarDays}
            placeholder={t('supervisorAlmacen.filter.dateLabel')}
            value={datePreset}
            defaultKey="all"
            options={DATE_PRESETS.map((p) => ({ key: p.value, label: t(p.labelKey) }))}
            onChange={(key) => setDatePreset(key as DatePreset)}
          />
          <FilterDropdown
            style={styles.filterItem}
            icon={UserRound}
            placeholder={t('supervisorAlmacen.filter.pickerLabel')}
            value={pickerId}
            defaultKey={ALL_PICKERS}
            options={[
              { key: ALL_PICKERS, label: t('supervisorAlmacen.filter.allPickers') },
              { key: UNASSIGNED, label: t('supervisorAlmacen.filter.unassigned') },
              ...pickers.map((p) => ({ key: p.uid, label: p.nombre })),
            ]}
            onChange={setPickerId}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <OrdersListCard
              order={item}
              href={`/(app)/supervisor-almacen/order/${item.id}`}
              variant="lead"
              hasTeam={item.teamPickerUids.length > 0}
              teamMemberCount={item.teamPickerUids.length}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#111827" />
        }
        ListEmptyComponent={
          <EmptyState
            title={t('supervisorAlmacen.list.emptyTitle')}
            description={t('supervisorAlmacen.list.emptySubtitle')}
            className="mt-10 px-4"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  headerWrap: { backgroundColor: '#F2F2F7' },
  blackBand: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  backBtn: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  headerCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    lineHeight: 20,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  filterItem: { flex: 1 },
});
