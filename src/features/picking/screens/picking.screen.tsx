import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useAppTabBarHeight } from '@/features/tabs/hooks/use-app-tab-bar-height';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { OrdersListCard } from '../components/orders-list-card';
import { OrdersListPage } from '../components/orders-list-page';
import { usePickerOrders, type PickerOrderFilter } from '../hooks/use-picker-orders';

function matchesSearch(order: { orderNumber: string; client: string }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return order.orderNumber.toLowerCase().includes(q) || order.client.toLowerCase().includes(q);
}

export function PickingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const tabBarHeight = useAppTabBarHeight();

  const [filter, setFilter] = useState<PickerOrderFilter>('all');
  const [search, setSearch] = useState('');

  const filteredOrders = usePickerOrders(filter);

  const orders = useMemo(
    () =>
      filteredOrders
        .filter((o) => matchesSearch(o, search))
        .sort((a, b) => {
          const aTime = new Date(a.assignedAt ?? a.createdAt).getTime();
          const bTime = new Date(b.assignedAt ?? b.createdAt).getTime();
          return bTime - aTime;
        }),
    [filteredOrders, search],
  );

  return (
    <>
      <OrdersListPage
        headerVariant="hero"
        title={t('picking.screen.titlePicker')}
        subtitle={t('picking.screen.subtitlePicker')}
        search={search}
        onSearchChange={setSearch}
        showStats={false}
        ordersCount={orders.length}
        filterValue={filter}
        onFilterChange={setFilter}
        onNotificationsPress={() => router.push('/(app)/picker/notifications' as never)}
        contentPaddingBottom={tabBarHeight + 20}
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <OrdersListCard
              order={item}
              href={`/(app)/picker/order/${item.id}`}
              variant="picker"
            />
          </View>
        )}
        listEmptyComponent={
          <EmptyState
            title={t('picking.screen.emptyTitle')}
            description={t('picking.screen.emptySubtitle')}
            className="mt-10 px-4"
          />
        }
      />
    </>
  );
}
