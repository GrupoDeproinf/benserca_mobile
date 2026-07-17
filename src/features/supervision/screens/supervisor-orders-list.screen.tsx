import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrdersListCard } from '@/features/picking/components/orders-list-card';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { Order, OrderStatus } from '@/features/picking/types';
import { ORDER_STATUS_I18N_KEY } from '@/features/picking/utils/order-status';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { Text } from '@/shared/components/ui/text';

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

interface SupervisorOrdersListScreenProps {
  status: OrderStatus;
}

const ALL_PICKERS = '__all__';
const UNASSIGNED = '__unassigned__';

export function SupervisorOrdersListScreen({ status }: SupervisorOrdersListScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const orders = useOrdersStore((s) => s.orders);
  const pickers = usePickersStore((s) => s.pickers);

  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [pickerId, setPickerId] = useState<string>(ALL_PICKERS);

  const filtered = useMemo<Order[]>(() => {
    const threshold = datePresetThreshold(datePreset);
    return orders.filter((o) => {
      if (o.status !== status) return false;

      if (threshold != null) {
        const created = new Date(o.createdAt).getTime();
        if (!Number.isFinite(created) || created < threshold) return false;
      }

      if (pickerId === UNASSIGNED) {
        if (o.assignedPickerId) return false;
      } else if (pickerId !== ALL_PICKERS) {
        if (o.assignedPickerId !== pickerId) return false;
      }

      return true;
    });
  }, [orders, status, datePreset, pickerId]);

  const statusLabel = t(ORDER_STATUS_I18N_KEY[status]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{statusLabel}</Text>
          <Text style={styles.headerCount}>
            {t('supervisorAlmacen.list.count', { count: filtered.length })}
          </Text>
        </View>
      </View>

      <View style={styles.filters}>
        <FilterRow
          label={t('supervisorAlmacen.filter.dateLabel')}
          chips={DATE_PRESETS.map((p) => ({ key: p.value, label: t(p.labelKey) }))}
          activeKey={datePreset}
          onSelect={(key) => setDatePreset(key as DatePreset)}
        />
        <FilterRow
          label={t('supervisorAlmacen.filter.pickerLabel')}
          chips={[
            { key: ALL_PICKERS, label: t('supervisorAlmacen.filter.allPickers') },
            { key: UNASSIGNED, label: t('supervisorAlmacen.filter.unassigned') },
            ...pickers.map((p) => ({ key: p.uid, label: p.nombre })),
          ]}
          activeKey={pickerId}
          onSelect={setPickerId}
        />
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
              hasTeam={Boolean(item.teamId)}
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

interface FilterRowProps {
  label: string;
  chips: { key: string; label: string }[];
  activeKey: string;
  onSelect: (key: string) => void;
}

function FilterRow({ label, chips, activeKey, onSelect }: FilterRowProps) {
  return (
    <View style={styles.filterRow}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {chips.map((chip) => {
          const active = chip.key === activeKey;
          return (
            <Pressable
              key={chip.key}
              onPress={() => onSelect(chip.key)}
              style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextIdle]}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#E5E5EA',
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  headerCount: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  filters: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#E5E5EA',
  },
  filterRow: { paddingTop: 10 },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    marginLeft: 0,
  },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipIdle: { backgroundColor: '#FFFFFF', borderColor: '#D1D1D6' },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  chipTextIdle: { color: '#374151' },
});
