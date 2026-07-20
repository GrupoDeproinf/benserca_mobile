import { ClipboardList } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';
import { ORDERS_LIST_CARD_GAP } from '@/features/picking/components/orders-list-page';
import { OrdersSearchFilter } from '@/features/picking/components/orders-search-filter';
import { AppHeroTitleSection } from '@/features/tabs/components/app-hero-title-section';
import { useAppTabBarHeight } from '@/features/tabs/hooks/use-app-tab-bar-height';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import { resolvePickerName } from '@/features/warehouse/utils/resolve-picker-name';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { Text } from '@/shared/components/ui/text';
import { AuditOrderCard } from '../components/audit-order-card';
import { useAuditQueue } from '../hooks/use-audit-queue';
import { useAuditQueueRefresh } from '../hooks/use-audit-queue-refresh';

function matchesSearch(order: { orderNumber: string; client: string }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    order.orderNumber.toLowerCase().includes(q) || order.client.toLowerCase().includes(q)
  );
}

export function AuditQueueScreen() {
  const { t } = useTranslation();
  const tabBarHeight = useAppTabBarHeight();
  const [search, setSearch] = useState('');

  const queue = useAuditQueue();
  const pickers = usePickersStore((s) => s.pickers);
  const { refreshing, refresh } = useAuditQueueRefresh();

  const filtered = useMemo(() => {
    return queue
      .filter((o) => matchesSearch(o, search))
      .sort((a, b) => {
        const aTime = new Date(a.packedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.packedAt ?? b.createdAt).getTime();
        return bTime - aTime;
      });
  }, [queue, search]);

  const listHeader = (
    <View style={{ paddingBottom: 8 }}>
      <AppHeroTitleSection
        title={t('audit.screen.title')}
        subtitle={t('audit.screen.subtitle')}
      >
        <OrdersSearchFilter
          search={search}
          onSearchChange={setSearch}
          showFilter={false}
          embedded
          searchPlaceholder={t('audit.screen.searchPlaceholder')}
          onRefresh={refresh}
          refreshing={refreshing}
          refreshLabel={t('audit.screen.refresh')}
        />
      </AppHeroTitleSection>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 12,
          gap: 8,
        }}
      >
        <ClipboardList size={18} color="#374151" strokeWidth={2} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
          {filtered.length} {t('audit.screen.ordersCount')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={{ height: ORDERS_LIST_CARD_GAP }} />}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 20,
          flexGrow: 1,
        }}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <AuditOrderCard
              order={item}
              pickerName={resolvePickerName(pickers, item.assignedPickerId)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title={t('audit.screen.emptyTitle')}
            description={t('audit.screen.emptySubtitle')}
            className="mt-10 px-4"
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      />
    </View>
  );
}
