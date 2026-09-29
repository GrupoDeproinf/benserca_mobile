import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';
import { FilterDropdown, type FilterDropdownOption } from '@/shared/components/ui/filter-dropdown';
import { RefreshIconButton } from '@/shared/components/ui/refresh-icon-button';
import { PICKER_FILTER_STATUSES } from '../hooks/use-picker-orders';
import { type OrderListFilter, orderListFilterLabelKey } from '../utils/order-status';

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  wrapEmbedded: {
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9E9EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#DCDCE0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  /**
   * Tope de ancho del filtro: una etiqueta larga ("Rechazado - Revisión") hacía
   * crecer el botón hasta dejar el campo de búsqueda en nada. Con el tope, la
   * etiqueta se recorta (`numberOfLines={1}`) y la búsqueda conserva su sitio.
   */
  filterItem: {
    flexShrink: 1,
    maxWidth: 148,
  },
  sideItem: {
    flexShrink: 0,
  },
});

interface OrdersSearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  /** Opciones del dropdown. Por defecto: estatus del picker. */
  filterOptions?: readonly string[];
  getFilterLabel?: (value: string, t: (key: string) => string) => string;
  showFilter?: boolean;
  /** Dentro de la card del header hero (sin margen inferior extra). */
  embedded?: boolean;
  searchPlaceholder?: string;
  /** Muestra un botón de refresh manual junto al filtro (misma estética). */
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshLabel?: string;
}

/**
 * Barra de búsqueda + filtro de las listas de pedidos (picker, jefe de almacén,
 * chequeador, pickers del jefe).
 *
 * El menú desplegable es el `FilterDropdown` compartido y no una copia local:
 * la copia que había aquí se quedó sin `statusBarTranslucent` y anclaba el menú
 * al borde derecho de la pantalla en vez de al botón, así que en Android el
 * filtro abría desplazado hacia abajo y separado del botón que lo dispara.
 */
export function OrdersSearchFilter({
  search,
  onSearchChange,
  filterValue = 'all',
  onFilterChange,
  filterOptions,
  getFilterLabel,
  showFilter = true,
  embedded = false,
  searchPlaceholder,
  onRefresh,
  refreshing = false,
  refreshLabel,
}: OrdersSearchFilterProps) {
  const { t } = useTranslation();

  const options: FilterDropdownOption[] = useMemo(
    () =>
      (filterOptions ?? PICKER_FILTER_STATUSES).map((value) => ({
        key: value,
        label: getFilterLabel
          ? getFilterLabel(value, t)
          : t(orderListFilterLabelKey(value as OrderListFilter)),
      })),
    [filterOptions, getFilterLabel, t],
  );

  return (
    <View style={[styles.wrap, embedded ? styles.wrapEmbedded : null]}>
      <View style={styles.row}>
        <View style={styles.searchWrap}>
          <Search size={18} color="#8E8E93" strokeWidth={2} />
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder ?? t('picking.screen.searchPlaceholder')}
            placeholderTextColor="#8E8E93"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            underlineColorAndroid="transparent"
          />
        </View>

        {showFilter && onFilterChange ? (
          <FilterDropdown
            style={styles.filterItem}
            placeholder={t('picking.filter.btn')}
            value={filterValue}
            options={options}
            onChange={onFilterChange}
            icon={SlidersHorizontal}
            defaultKey="all"
          />
        ) : null}

        {onRefresh ? (
          <View style={styles.sideItem}>
            <RefreshIconButton
              onPress={onRefresh}
              refreshing={refreshing}
              accessibilityLabel={refreshLabel}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
