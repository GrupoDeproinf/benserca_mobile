import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { OrdersListCard } from '@/features/picking/components/orders-list-card';
import { OrdersListPage } from '@/features/picking/components/orders-list-page';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import {
  matchesOrderListFilter,
  type OrderListFilter,
} from '@/features/picking/utils/order-status';
import { useAppTabBarHeight } from '@/features/tabs/hooks/use-app-tab-bar-height';
import { EmptyState } from '@/shared/components/ui/empty-state';

/**
 * Estatus que puede tener un pedido en la lista del jefe de almacén. Embalado y
 * despachado quedan fuera porque la propia lista los excluye; `paused` no es un
 * estatus sino una situación (ver `matchesOrderListFilter`).
 */
const LEAD_FILTER_STATUSES: readonly OrderListFilter[] = [
  'all',
  'new',
  'assigned',
  'in_progress',
  'to_pack',
  'audited',
  'rejected_review',
  'paused',
];

function matchesSearch(order: { orderNumber: string; client: string }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    String(order.orderNumber).toLowerCase().includes(q) ||
    String(order.client).toLowerCase().includes(q)
  );
}

export function LeadOrdersScreen() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const tabBarHeight = useAppTabBarHeight();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OrderListFilter>('all');

  const allOrders = useOrdersStore((s) => s.orders);
  // Embalado es el final del recorrido del jefe: al marcarlo el pedido sale de
  // su lista. Despachado se excluye también porque viene después; si no, el
  // pedido desaparecería al embalar y reaparecería al despacharse. El mismo
  // hueco cubre `Listo para despachar`, `En guía` y `Rechazado en guía`.
  // Incluye los que tiene asignados como picker aunque el `team.chief_uid` sea
  // de otro jefe (picker ascendido a jefe con pedidos pendientes).
  const leadOrders = useMemo(
    () =>
      allOrders.filter(
        (o) =>
          (o.assignedLeadId === user?.uid || o.assignedPickerId === user?.uid) &&
          o.status !== 'packed' &&
          o.status !== 'dispatched',
      ),
    [allOrders, user?.uid],
  );

  const orders = useMemo(
    () =>
      leadOrders
        .filter((o) => matchesOrderListFilter(o, filter) && matchesSearch(o, search))
        .sort((a, b) => {
          const aTime = new Date(a.assignedAt ?? a.createdAt).getTime();
          const bTime = new Date(b.assignedAt ?? b.createdAt).getTime();
          return bTime - aTime;
        }),
    [leadOrders, filter, search],
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
      filterValue={filter}
      onFilterChange={(value) => setFilter(value as OrderListFilter)}
      filterOptions={LEAD_FILTER_STATUSES}
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
