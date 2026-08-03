import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { OrdersListCard } from '@/features/picking/components/orders-list-card';
import { OrdersListPage } from '@/features/picking/components/orders-list-page';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { useAppTabBarHeight } from '@/features/tabs/hooks/use-app-tab-bar-height';
import { EmptyState } from '@/shared/components/ui/empty-state';

function matchesSearch(order: { orderNumber: string; client: string }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return order.orderNumber.toLowerCase().includes(q) || order.client.toLowerCase().includes(q);
}

export function LeadOrdersScreen() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const tabBarHeight = useAppTabBarHeight();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const allOrders = useOrdersStore((s) => s.orders);
  // Embalado es el final del recorrido del jefe: al marcarlo el pedido sale de
  // su lista. Despachado se excluye también porque viene después; si no, el
  // pedido desaparecería al embalar y reaparecería al despacharse.
  const leadOrders = useMemo(
    () =>
      allOrders.filter(
        (o) => o.assignedLeadId === user?.uid && o.status !== 'packed' && o.status !== 'dispatched',
      ),
    [allOrders, user?.uid],
  );

  const orders = useMemo(
    () =>
      leadOrders
        .filter((o) => matchesSearch(o, search))
        .sort((a, b) => {
          const aTime = new Date(a.assignedAt ?? a.createdAt).getTime();
          const bTime = new Date(b.assignedAt ?? b.createdAt).getTime();
          return bTime - aTime;
        }),
    [leadOrders, search],
  );

  return (
    <OrdersListPage
      headerVariant="hero"
      title={t('teams.screen.title')}
      subtitle={t('teams.screen.subtitle')}
      search={search}
      onSearchChange={setSearch}
      showStats={false}
      ordersCount={orders.length}
      showFilter={false}
      onNotificationsPress={() => router.push('/(app)/lead/notifications' as never)}
      contentPaddingBottom={tabBarHeight + 20}
      data={orders}
      keyExtractor={(o) => o.id}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16 }}>
          <OrdersListCard
            order={item}
            href={`/(app)/lead/team/${item.id}`}
            variant="lead"
            hasTeam={item.teamPickerUids.length > 0}
            teamMemberCount={item.teamPickerUids.length}
          />
        </View>
      )}
      listEmptyComponent={
        <EmptyState
          title={t('teams.screen.emptyTitle')}
          description={t('teams.screen.emptySubtitle')}
          className="mt-10 px-4"
        />
      }
    />
  );
}
