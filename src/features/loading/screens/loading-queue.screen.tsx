import { Truck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, useWindowDimensions, View } from 'react-native';
import { ORDERS_LIST_CARD_GAP } from '@/features/picking/components/orders-list-page';
import { OrdersSearchFilter } from '@/features/picking/components/orders-search-filter';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { Order } from '@/features/picking/types';
import { AppHeroTitleSection } from '@/features/tabs/components/app-hero-title-section';
import { useAppTabBarHeight } from '@/features/tabs/hooks/use-app-tab-bar-height';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { Text } from '@/shared/components/ui/text';
import { LoadingOrderCard } from '../components/loading-order-card';
import { getLoadingProgress } from '../utils/loading-progress';

const LIST_PADDING = 16;
const COLUMN_GAP = 16;

/** Dos columnas solo con mucho ancho (tablet en horizontal): la tarjeta necesita aire. */
function listColumnsFor(width: number): number {
  return width >= 1000 ? 2 : 1;
}

function matchesSearch(order: Order, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return order.orderNumber.toLowerCase().includes(q) || order.client.toLowerCase().includes(q);
}

/**
 * Orden de la lista: primero los que ya se empezaron a cargar (hay un camión a
 * medio llenar con ellos), después el resto, del más antiguo al más nuevo.
 */
function compareForLoading(a: Order, b: Order): number {
  const aStarted = a.loadedBundles.length > 0;
  const bStarted = b.loadedBundles.length > 0;
  if (aStarted !== bStarted) return aStarted ? -1 : 1;
  const aTime = new Date(a.packedAt ?? a.createdAt).getTime();
  const bTime = new Date(b.packedAt ?? b.createdAt).getTime();
  return aTime - bTime;
}

/**
 * Pedidos embalados por subir al camión (rol `pedido_cargador`). Llegan en
 * tiempo real del listener de sesión, que para este rol solo trae Embalados;
 * el filtro por estatus de aquí cubre el instante entre despachar un pedido
 * (optimista) y que el listener lo saque.
 */
export function LoadingQueueScreen() {
  const { t } = useTranslation();
  const tabBarHeight = useAppTabBarHeight();
  const [search, setSearch] = useState('');
  const orders = useOrdersStore((s) => s.orders);
  const { width } = useWindowDimensions();
  const columns = listColumnsFor(width);
  // Ancho fijo por celda (y no `flex: 1`): con un número impar de pedidos, el
  // último no debe estirarse a todo el ancho.
  const cellWidth = Math.floor((width - LIST_PADDING * 2 - COLUMN_GAP * (columns - 1)) / columns);

  const queue = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'packed' && matchesSearch(o, search))
        .sort(compareForLoading),
    [orders, search],
  );
  const readyCount = queue.filter((o) => getLoadingProgress(o).complete).length;

  const listHeader = (
    <View style={{ paddingBottom: 8 }}>
      <AppHeroTitleSection
        title={t('loading.screen.title')}
        subtitle={t('loading.screen.subtitle')}
      >
        <OrdersSearchFilter
          search={search}
          onSearchChange={setSearch}
          showFilter={false}
          embedded
          searchPlaceholder={t('loading.screen.searchPlaceholder')}
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
        <Truck size={18} color="#374151" strokeWidth={2} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
          {queue.length} {t('loading.screen.ordersCount')}
        </Text>
        {readyCount > 0 ? (
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803D' }}>
            · {readyCount} {t('loading.card.readyBadge').toLowerCase()}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <FlatList
        // `numColumns` no puede cambiar sobre una lista montada: la `key` la
        // vuelve a crear al girar la tablet.
        key={`cols-${columns}`}
        numColumns={columns}
        columnWrapperStyle={
          columns > 1 ? { paddingHorizontal: LIST_PADDING, gap: COLUMN_GAP } : undefined
        }
        data={queue}
        keyExtractor={(o) => o.id}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={{ height: ORDERS_LIST_CARD_GAP }} />}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20, flexGrow: 1 }}
        renderItem={({ item }) => (
          <View style={columns > 1 ? { width: cellWidth } : { paddingHorizontal: LIST_PADDING }}>
            <LoadingOrderCard order={item} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title={t('loading.screen.emptyTitle')}
            description={t('loading.screen.emptySubtitle')}
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
