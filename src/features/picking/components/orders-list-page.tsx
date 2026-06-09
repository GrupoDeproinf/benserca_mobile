import type { LucideIcon } from 'lucide-react-native';
import { ArrowUpDown, ClipboardList } from 'lucide-react-native';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View, type ListRenderItem } from 'react-native';
import { AppHeroTitleSection } from '@/features/tabs/components/app-hero-title-section';
import { Text } from '@/shared/components/ui/text';
import type { PickerOrderFilter } from '../hooks/use-picker-orders';
import { AppTopBar } from './app-top-bar';
import { OrdersSearchFilter } from './orders-search-filter';
import { OrdersStatsGrid, type OrdersStatItem } from './orders-stats-grid';

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
  filterValue?: PickerOrderFilter;
  onFilterChange?: (value: PickerOrderFilter) => void;
  showFilter?: boolean;
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
  showFilter = true,
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
      onFilterChange={
        onFilterChange ? (value) => onFilterChange(value as PickerOrderFilter) : undefined
      }
      showFilter={showFilter}
      embedded={embedded}
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
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          marginTop: showStats && stats.length > 0 ? 20 : isHero ? 0 : 4,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={18} color="#374151" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
            {ordersCount} {t('picking.screen.ordersCount')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <ArrowUpDown size={14} color="#6B7280" />
          <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
            {t('picking.screen.sortRecent')}
          </Text>
        </View>
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

export type { OrdersStatItem, LucideIcon };
