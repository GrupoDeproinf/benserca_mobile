import { Users2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { ORDERS_LIST_CARD_GAP } from '@/features/picking/components/orders-list-page';
import { OrdersSearchFilter } from '@/features/picking/components/orders-search-filter';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { PickerStatusCard } from '@/features/supervision/components/picker-status-card';
import { AppHeroTitleSection } from '@/features/tabs/components/app-hero-title-section';
import { useAppTabBarHeight } from '@/features/tabs/hooks/use-app-tab-bar-height';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import type { PickerEstado, PickerStatus } from '@/features/warehouse/types';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { Text } from '@/shared/components/ui/text';

const STATUS_ORDER: PickerStatus[] = ['en_proceso', 'reservado', 'por_embalar', 'disponible'];

function matchesSearch(picker: PickerEstado, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return picker.nombre.toLowerCase().includes(q);
}

export function LeadPickersScreen() {
  const { t } = useTranslation();
  const tabBarHeight = useAppTabBarHeight();
  const [search, setSearch] = useState('');

  const pickers = usePickersStore((s) => s.pickers);
  const orders = useOrdersStore((s) => s.orders);

  const sorted = useMemo(
    () =>
      [...pickers]
        .filter((p) => matchesSearch(p, search))
        .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)),
    [pickers, search],
  );

  const listHeader = (
    <View style={{ paddingBottom: 8 }}>
      <AppHeroTitleSection
        title={t('supervision.screen.title')}
        subtitle={t('supervision.screen.subtitle')}
      >
        <OrdersSearchFilter
          search={search}
          onSearchChange={setSearch}
          showFilter={false}
          embedded
          searchPlaceholder={t('supervision.screen.searchPlaceholder')}
        />
      </AppHeroTitleSection>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
      >
        <Users2 size={18} color="#374151" />
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginLeft: 8 }}>
          {sorted.length} {t('supervision.screen.pickersCount')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <FlatList
        data={sorted}
        keyExtractor={(p) => p.uid}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={{ height: ORDERS_LIST_CARD_GAP }} />}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 20,
          flexGrow: 1,
        }}
        renderItem={({ item }) => {
          const order = item.activeOrderId
            ? orders.find((o) => o.id === item.activeOrderId)
            : undefined;
          return (
            <View style={{ paddingHorizontal: 16 }}>
              <PickerStatusCard
                picker={item}
                activeOrderNumber={order?.orderNumber}
                activeOrderClient={order?.client}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title={t('supervision.screen.emptyTitle')}
            description={t('supervision.screen.emptySubtitle')}
            className="mt-10 px-4"
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}
