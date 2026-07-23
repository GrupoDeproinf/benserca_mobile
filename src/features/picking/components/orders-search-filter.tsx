import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  type LayoutRectangle,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RefreshIconButton } from '@/shared/components/ui/refresh-icon-button';
import { PICKER_FILTER_STATUSES } from '../hooks/use-picker-orders';
import { ORDER_STATUS_I18N_KEY } from '../utils/order-status';

const FILTER_BG = '#FFFFFF';
const DROPDOWN_GAP = 6;
const SCREEN_EDGE = 16;
const DROPDOWN_WIDTH = 200;

function dropdownLayout(anchor: LayoutRectangle) {
  const screenWidth = Dimensions.get('window').width;
  const width = Math.min(DROPDOWN_WIDTH, screenWidth - SCREEN_EDGE * 2);
  return {
    top: anchor.y + anchor.height + DROPDOWN_GAP,
    right: SCREEN_EDGE,
    width,
  };
}

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
  filterAnchor: {
    flexShrink: 0,
  },
  filterPressable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: FILTER_BG,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  filterBtnActive: {
    borderColor: '#111827',
  },
  filterBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
  },
  filterBtnLabelActive: {
    color: '#111827',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingVertical: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  /** Red de seguridad si `measureInWindow` no devuelve la posición del botón. */
  dropdownFallback: {
    top: '30%',
    right: SCREEN_EDGE,
    width: DROPDOWN_WIDTH,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemSelected: {
    backgroundColor: '#F2F2F7',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  dropdownItemTextSelected: {
    fontWeight: '700',
  },
});

function filterLabel(
  status: string,
  t: (key: string) => string,
  getFilterLabel?: (value: string, t: (key: string) => string) => string,
): string {
  if (status === 'all') return t('common.all');
  if (getFilterLabel) return getFilterLabel(status, t);
  return t(ORDER_STATUS_I18N_KEY[status as keyof typeof ORDER_STATUS_I18N_KEY]);
}

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
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const filterBtnRef = useRef<View>(null);

  const options = filterOptions ?? PICKER_FILTER_STATUSES;
  const filterActive = filterValue !== 'all';
  const buttonLabel = filterActive
    ? filterLabel(filterValue, t, getFilterLabel)
    : t('picking.filter.btn');

  const measureAnchor = useCallback(() => {
    const node = filterBtnRef.current;
    if (!node || typeof node.measureInWindow !== 'function') return;
    node.measureInWindow((x, y, width, height) => {
      // En Android la medición puede devolver valores vacíos si la vista no
      // está en la ventana activa; en ese caso se conserva el anchor previo.
      if (!Number.isFinite(y) || !Number.isFinite(height) || height === 0) return;
      setAnchor({ x, y, width, height });
    });
  }, []);

  /**
   * Se mide ANTES de abrir: una vez montado el Modal, en Android la vista del
   * botón queda en la ventana de fondo y `measureInWindow` no responde, con lo
   * que el menú se quedaría sin posición (backdrop visible, dropdown vacío).
   */
  const toggle = () => {
    measureAnchor();
    setOpen((v) => !v);
  };

  const select = (status: string) => {
    onFilterChange?.(status);
    setOpen(false);
  };

  const close = () => setOpen(false);

  const menu = anchor ? dropdownLayout(anchor) : null;

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
          <View style={styles.filterAnchor}>
            <Pressable
              onPress={toggle}
              style={({ pressed }) => [styles.filterPressable, pressed && { opacity: 0.92 }]}
              android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
            >
              <View
                ref={filterBtnRef}
                onLayout={measureAnchor}
                style={[styles.filterBtn, (filterActive || open) && styles.filterBtnActive]}
                collapsable={false}
              >
                <SlidersHorizontal size={15} color="#3C3C43" strokeWidth={2} />
                <Text
                  style={[styles.filterBtnLabel, filterActive && styles.filterBtnLabelActive]}
                  numberOfLines={1}
                >
                  {buttonLabel}
                </Text>
                <ChevronDown
                  size={14}
                  color="#3C3C43"
                  strokeWidth={2.5}
                  style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
                />
              </View>
            </Pressable>
          </View>
        ) : null}

        {onRefresh ? (
          <View style={styles.filterAnchor}>
            <RefreshIconButton
              onPress={onRefresh}
              refreshing={refreshing}
              accessibilityLabel={refreshLabel}
            />
          </View>
        ) : null}
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable style={styles.backdrop} onPress={close} />
          {/* Si la medición falló, se cae a una posición por defecto: abrir el
              menú mal ubicado es preferible a abrir un modal vacío. */}
          <View
            style={[
              styles.dropdown,
              menu
                ? { top: menu.top, right: menu.right, width: menu.width }
                : styles.dropdownFallback,
            ]}
          >
            {options.map((status) => {
              const selected = filterValue === status;
              return (
                <Pressable
                  key={status}
                  onPress={() => select(status)}
                  style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                >
                  <Text
                    style={[styles.dropdownItemText, selected && styles.dropdownItemTextSelected]}
                    numberOfLines={1}
                  >
                    {filterLabel(status, t, getFilterLabel)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}
