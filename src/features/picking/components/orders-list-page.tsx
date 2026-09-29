import type { LucideIcon } from 'lucide-react-native';
import { ClipboardList } from 'lucide-react-native';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, type ListRenderItem, View } from 'react-native';
import { AppHeroTitleSection } from '@/features/tabs/components/app-hero-title-section';
import { Text } from '@/shared/components/ui/text';
import { AppTopBar } from './app-top-bar';
import { OrdersSearchFilter } from './orders-search-filter';
import { type OrdersStatItem, OrdersStatsGrid } from './orders-stats-grid';

/** Espacio entre cards en la lista (FlatList ItemSeparator). */
export const ORDERS_LIST_CARD_GAP = 24;

interface OrdersListPageProps<T> {
  title: string;
  subtitle: string;
  search: string;
  onSearchChange: (value: string) => void;
  stats?: OrdersStatItem[];
  showStats?: boolean;
  ordersCount: number;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  /** Opciones del dropdown; por defecto las del picker (`PICKER_FILTER_STATUSES`). */
  filterOptions?: readonly string[];
  getFilterLabel?: (value: string, t: (key: string) => string) => string;
  showFilter?: boolean;
  /** Botón de refresh manual junto al filtro. */
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshLabel?: string;
  onNotificationsPress: () => void;
  onScanPress?: () => void;
  contentPaddingBottom: number;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
  listEmptyComponent?: ReactElement | null;
  /** `hero`: franja negra + card (picker). `appBar`: logo + campana (lead, etc.). */
  headerVariant?: 'appBar' | 'hero';
}

export function OrdersListPage<T>({
  title,
  subtitle,
  search,
  onSearchChange,
  stats = [],
  showStats = false,
  ordersCount,
  filterValue = 'all',
  onFilterChange,
  filterOptions,
  getFilterLabel,
  showFilter = true,
  onRefresh,
  refreshing = false,
  refreshLabel,
  onNotificationsPress,
  onScanPress,
  contentPaddingBottom,
  data,
  keyExtractor,
  renderItem,
  listEmptyComponent,
  headerVariant = 'appBar',
}: OrdersListPageProps<T>) {
  const { t } = useTranslation();
  const isHero = headerVariant === 'hero';

  const searchFilter = (embedded: boolean) => (
    <OrdersSearchFilter
      search={search}
      onSearchChange={onSearchChange}
      filterValue={filterValue}
      onFilterChange={onFilterChange}
      filterOptions={filterOptions}
      getFilterLabel={getFilterLabel}
      showFilter={showFilter}
      embedded={embedded}
      onRefresh={onRefresh}
      refreshing={refreshing}
      refreshLabel={refreshLabel}
    />
  );

  const listHeader = (
    <View style={{ paddingBottom: 8 }}>
      {isHero ? (
        <AppHeroTitleSection title={title} subtitle={subtitle}>
          {searchFilter(true)}
        </AppHeroTitleSection>
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ paddingTop: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#111827', lineHeight: 34 }}>
              {title}
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>{subtitle}</Text>
          </View>
          {searchFilter(false)}
        </View>
      )}

      {showStats && stats.length > 0 ? (
        <View style={{ paddingHorizontal: 16 }}>
          <OrdersStatsGrid stats={stats} />
        </View>
      ) : null}

      {/* Encabezado de lista */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginTop: showStats && stats.length > 0 ? 20 : isHero ? 16 : 4,
          marginBottom: 12,
          gap: 8,
        }}
      >
        <ClipboardList size={18} color="#374151" />
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
          {ordersCount} {t('picking.screen.ordersCount')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      {!isHero ? (
        <AppTopBar onNotificationsPress={onNotificationsPress} onScanPress={onScanPress} />
      ) : null}
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: ORDERS_LIST_CARD_GAP }} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmptyComponent}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

export type { LucideIcon, OrdersStatItem };
