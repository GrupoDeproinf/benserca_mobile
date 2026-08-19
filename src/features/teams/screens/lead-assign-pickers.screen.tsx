import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Users2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { OrderActionButton } from '@/features/picking/components/order-action-button';
import { ORDERS_LIST_CARD_GAP } from '@/features/picking/components/orders-list-page';
import { OrdersSearchFilter } from '@/features/picking/components/orders-search-filter';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { AppHeroTitleSection } from '@/features/tabs/components/app-hero-title-section';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import { derivePickerActivity } from '@/features/warehouse/utils/derive-picker-activity';
import { ConfirmSheet } from '@/shared/components/ui/confirm-sheet';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { AssignPickerListRow } from '../components/assign-picker-list-row';
import { AssignPickersHeader } from '../components/assign-pickers-header';
import { AssignTeamDraftPanel } from '../components/assign-team-draft-panel';
import { useTeamsStore } from '../store/teams.store';

interface LeadAssignPickersScreenProps {
  orderId: string;
}

const SCREEN_BG = '#F2F2F7';

function matchesSearch(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return name.toLowerCase().includes(q);
}

export function LeadAssignPickersScreen({ orderId }: LeadAssignPickersScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();

  const order = useOrdersStore((s) => s.getOrderById(orderId));
  const allPickers = usePickersStore((s) => s.pickers);
  const orders = useOrdersStore((s) => s.orders);
  const createTeam = useTeamsStore((s) => s.createTeam);

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);

  const availablePickers = useMemo(
    () =>
      allPickers
        // El propio jefe está en la lista de operación (puede pickear solo),
        // pero no se arma un equipo consigo mismo: para eso está "Trabajar yo solo".
        .filter((p) => p.uid !== user?.uid)
        .map((p) => ({
          ...p,
          status: derivePickerActivity(p.uid, orders, p.isAvailable, p.activeOrderId).status,
        }))
        .filter((p) => matchesSearch(p.nombre, search)),
    [allPickers, orders, search, user?.uid],
  );

  const selectedPickers = useMemo(
    () => allPickers.filter((p) => selectedIds.has(p.uid)),
    [allPickers, selectedIds],
  );

  const selectionKey = useMemo(() => [...selectedIds].sort().join(','), [selectedIds]);

  if (!order || !user) {
    return (
      <View style={[styles.centered, { backgroundColor: SCREEN_BG }]}>
        <Text style={styles.notFound}>{t('teams.manage.notFound')}</Text>
      </View>
    );
  }

  const togglePicker = (uid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedIds.size === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    createTeam(order.id, user.uid, Array.from(selectedIds));
    setConfirmVisible(false);
    router.back();
  };

  const dockHeight = selectedIds.size > 0 ? 52 + 12 + Math.max(insets.bottom, 16) + 8 : 0;

  const listHeader = (
    <View style={styles.listHeader}>
      <AppHeroTitleSection title={t('teams.assign.title')} subtitle={t('teams.assign.subtitle')}>
        <OrdersSearchFilter
          search={search}
          onSearchChange={setSearch}
          showFilter={false}
          embedded
          searchPlaceholder={t('teams.assign.searchPlaceholder')}
        />
      </AppHeroTitleSection>

      <View style={styles.draftWrap}>
        <AssignTeamDraftPanel pickers={selectedPickers} onRemove={(uid) => togglePicker(uid)} />
      </View>

      <View style={styles.countRow}>
        <Users2 size={18} color="#374151" strokeWidth={2} />
        <Text style={styles.countLabel}>
          {availablePickers.length} {t('teams.assign.availableLabel')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <AssignPickersHeader
        orderNumber={order.orderNumber}
        client={order.client}
        onBack={() => router.back()}
      />

      <FlatList
        data={availablePickers}
        keyExtractor={(p) => p.uid}
        extraData={selectionKey}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={{ height: ORDERS_LIST_CARD_GAP }} />}
        contentContainerStyle={{
          paddingBottom: dockHeight + 16,
          flexGrow: 1,
        }}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <AssignPickerListRow
              picker={item}
              selected={selectedIds.has(item.uid)}
              onPress={() => togglePicker(item.uid)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title={t('teams.assign.emptyTitle')}
            description={t('teams.assign.emptySubtitle')}
            className="mt-8 px-2"
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      {selectedIds.size > 0 && !confirmVisible ? (
        <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <OrderActionButton
            label={t('teams.assign.confirmBtn', { count: selectedIds.size })}
            onPress={() => setConfirmVisible(true)}
            variant="primary"
            icon={Users2}
          />
        </View>
      ) : null}

      <ConfirmSheet
        visible={confirmVisible}
        title={t('teams.create.title')}
        message={t('teams.create.body', { count: selectedIds.size })}
        mode="confirm"
        confirmLabel={t('teams.create.confirm')}
        icon={Users2}
        onConfirm={handleConfirm}
        onClose={() => setConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: 15,
    color: '#6B7280',
  },
  listHeader: {
    gap: 16,
    paddingBottom: 12,
  },
  draftWrap: {
    paddingHorizontal: 16,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  countLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: SCREEN_BG,
  },
});
