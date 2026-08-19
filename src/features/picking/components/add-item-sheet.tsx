import * as Haptics from 'expo-haptics';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpandableText } from '@/shared/components/ui/expandable-text';
import { FilterDropdown, type FilterDropdownOption } from '@/shared/components/ui/filter-dropdown';
import { Toast, useToast } from '@/shared/components/ui/toast';
import type { Bulto, Order, OrderLine } from '../types';
import {
  getActiveOrderLines,
  getMaxAddQtyForOrderLine,
  type PendingAdd,
} from '../utils/bulto-capacity';
import { OrderActionButton } from './order-action-button';
import { QtyStepper } from './qty-stepper';

export interface AddItemEntry {
  /** Renglón del pedido al que pertenece la cantidad (`OrderLine.id`). */
  lineId: string;
  sku: string;
  name: string;
  qty: number;
}

interface AddItemSheetProps {
  visible: boolean;
  order: Order;
  bulto: Bulto | null;
  onClose: () => void;
  onAddItems: (items: AddItemEntry[]) => void;
}

const ALL_CATEGORIES = 'all';

/**
 * Categoría de la línea, que es a la vez clave y etiqueta del filtro.
 *
 * Las líneas del pedido traen el nombre legible en `category` ("ACCESORIOS").
 * `coCat` queda como respaldo por si algún pedido llegara solo con el código
 * de Profit; los pedidos actuales no lo traen.
 */
function categoriaDeArticulo(line: OrderLine): string | null {
  const nombre = line.category?.trim();
  if (nombre) return nombre;
  const codigo = line.coCat?.trim();
  return codigo ? codigo : null;
}

/** Categorías presentes en la lista, sin repetir y ordenadas alfabéticamente. */
function buildCategoriaOptions(lines: OrderLine[]): FilterDropdownOption[] {
  const categorias = new Set<string>();

  for (const line of lines) {
    const categoria = categoriaDeArticulo(line);
    if (categoria) categorias.add(categoria);
  }

  return [...categorias]
    .sort((a, b) => a.localeCompare(b))
    .map((categoria) => ({ key: categoria, label: categoria }));
}

export function AddItemSheet({ visible, order, bulto, onClose, onAddItems }: AddItemSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { message: toastMessage, nudgeToken: toastNudge, show: showToast } = useToast();
  const maxReachedTooltip = t('picking.addItem.capacityExceededTooltip');
  const activeLines = getActiveOrderLines(order);

  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState(ALL_CATEGORIES);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  /** Las categorías del filtro son las de los artículos del propio pedido. */
  const categoriaOptions: FilterDropdownOption[] = useMemo(
    () => [
      { key: ALL_CATEGORIES, label: t('picking.addItem.categoryAll') },
      ...buildCategoriaOptions(activeLines),
    ],
    [activeLines, t],
  );

  /**
   * La lista son los RENGLONES del pedido, no los artículos: si Profit mandó el
   * mismo SKU dos veces (19 + 1), salen dos filas y cada una se completa por
   * separado. No se consulta la colección `articulos`: búsqueda y filtro se
   * resuelven en memoria sobre estos renglones.
   */
  const displayList: OrderLine[] = useMemo(() => {
    const query = search.trim().toUpperCase();

    return activeLines.filter((line) => {
      if (categoria !== ALL_CATEGORIES && categoriaDeArticulo(line) !== categoria) {
        return false;
      }
      if (!query) return true;
      return line.sku.toUpperCase().includes(query) || line.name.toUpperCase().includes(query);
    });
  }, [activeLines, categoria, search]);

  /** SKUs que aparecen en más de un renglón: sus filas se marcan para poder distinguirlas. */
  const duplicatedSkus = useMemo(() => {
    const count = new Map<string, number>();
    for (const line of activeLines) count.set(line.sku, (count.get(line.sku) ?? 0) + 1);
    return new Set([...count.entries()].filter(([, c]) => c > 1).map(([sku]) => sku));
  }, [activeLines]);

  const pendingAdds: PendingAdd[] = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([lineId, qty]) => ({ lineId, qty })),
    [quantities],
  );

  const totalToAdd = useMemo(
    () => Object.values(quantities).reduce((sum, q) => sum + (q > 0 ? q : 0), 0),
    [quantities],
  );

  const reset = () => {
    setSearch('');
    setCategoria(ALL_CATEGORIES);
    setQuantities({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const setLineQty = (lineId: string, qty: number) => {
    if (!bulto) return;
    const max = getMaxAddQtyForOrderLine(
      order,
      bulto,
      lineId,
      pendingAdds.filter((p) => p.lineId !== lineId),
    );
    if (qty > max) showToast(maxReachedTooltip);
    const clamped = Math.max(0, Math.min(qty, max));
    setQuantities((prev) => {
      const next = { ...prev };
      if (clamped <= 0) {
        delete next[lineId];
      } else {
        next[lineId] = clamped;
      }
      return next;
    });
  };

  const handleAdd = () => {
    const items: AddItemEntry[] = displayList
      .filter((line) => (quantities[line.id] ?? 0) > 0)
      .map((line) => ({
        lineId: line.id,
        sku: line.sku,
        name: line.name,
        qty: quantities[line.id],
      }));
    if (items.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddItems(items);
    reset();
  };

  const renderRow = ({ item }: { item: OrderLine }) => {
    const qty = quantities[item.id] ?? 0;
    const maxAdd = bulto
      ? getMaxAddQtyForOrderLine(
          order,
          bulto,
          item.id,
          pendingAdds.filter((p) => p.lineId !== item.id),
        )
      : 0;
    const canAdd = maxAdd > 0;

    const row = (
      <View style={[styles.row, !canAdd && styles.rowDisabled]}>
        <View style={styles.rowInfo}>
          <ExpandableText style={styles.rowName} numberOfLines={2}>
            {item.name}
          </ExpandableText>
          <Text style={styles.rowSku}>
            {item.sku}
            {duplicatedSkus.has(item.sku)
              ? ` · ${t('picking.addItem.lineQty', { qty: item.requiredQty })}`
              : ''}
          </Text>
          <Text style={[styles.maxHint, !canAdd && styles.maxHintMuted]}>
            {canAdd
              ? t('picking.addItem.maxPerArticle', { max: maxAdd })
              : t('picking.addItem.noSpace')}
          </Text>
        </View>
        <QtyStepper
          value={qty}
          onChange={(v) => setLineQty(item.id, v)}
          min={0}
          max={maxAdd}
          editable
          onAtMax={() => showToast(maxReachedTooltip)}
        />
      </View>
    );

    if (!canAdd) {
      return <Pressable onPress={() => showToast(maxReachedTooltip)}>{row}</Pressable>;
    }

    return row;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>
            {t('picking.addItem.title', { number: bulto?.number ?? '—' })}
          </Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <X size={22} color="#8E8E93" />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchFilterRow}>
            <View style={styles.searchRow}>
              <Search size={16} color="#8E8E93" style={styles.searchIcon} />
              <TextInput
                placeholder={t('picking.addItem.searchPlaceholder')}
                placeholderTextColor="#8E8E93"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="characters"
              />
            </View>

            <FilterDropdown
              placeholder={t('picking.addItem.categoryFilter')}
              value={categoria}
              options={categoriaOptions}
              onChange={setCategoria}
              icon={SlidersHorizontal}
              defaultKey={ALL_CATEGORIES}
              style={styles.filterAnchor}
            />
          </View>
        </View>

        <FlatList
          data={displayList}
          keyExtractor={(i) => i.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.empty}>{t('picking.addItem.noResults')}</Text>}
        />

        <Toast message={toastMessage} nudgeToken={toastNudge} topInset={insets.top + 12} />

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <OrderActionButton
            label={
              totalToAdd > 0
                ? t('picking.addItem.addWithCount', { count: totalToAdd })
                : t('picking.addItem.add')
            }
            onPress={handleAdd}
            disabled={totalToAdd === 0}
            icon={Plus}
            variant="primary"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterAnchor: {
    flexShrink: 0,
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCDCE0',
    backgroundColor: '#E9E9EB',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
  },
  rowDisabled: {
    opacity: 0.55,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  rowSku: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  maxHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  maxHintMuted: {
    color: '#9CA3AF',
  },
  separator: {
    height: 8,
  },
  empty: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 24,
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F2F2F7',
  },
});
