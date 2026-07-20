import * as Haptics from 'expo-haptics';
import { Plus, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast, useToast } from '@/shared/components/ui/toast';
import type { Articulo } from '../hooks/use-articulos-search';
import { useArticulosSearch } from '../hooks/use-articulos-search';
import type { Bulto, Order, OrderLine } from '../types';
import {
  getActiveOrderLines,
  getMaxAddQtyForOrderLine,
  type PendingAdd,
} from '../utils/bulto-capacity';
import { OrderActionButton } from './order-action-button';
import { QtyStepper } from './qty-stepper';

export interface AddItemEntry {
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

/** Converts an order line to the Articulo shape used by the list. */
function orderLineToArticulo(line: OrderLine): Articulo {
  return {
    sku: line.sku,
    name: line.name,
    talla: line.talla,
  };
}

export function AddItemSheet({
  visible,
  order,
  bulto,
  onClose,
  onAddItems,
}: AddItemSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { message: toastMessage, nudgeToken: toastNudge, show: showToast } = useToast();
  const maxReachedTooltip = t('picking.addItem.capacityExceededTooltip');
  const activeLines = getActiveOrderLines(order);

  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { results: firestoreResults, loading: searchLoading } = useArticulosSearch(
    search,
    visible,
  );

  // When no search: show the order's active lines.
  // When searching: show Firestore results.
  const displayList: Articulo[] = useMemo(() => {
    if (search.trim().length >= 2) return firestoreResults;
    return activeLines.map(orderLineToArticulo);
  }, [search, firestoreResults, activeLines]);

  const pendingAdds: PendingAdd[] = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([sku, qty]) => ({ sku, qty })),
    [quantities],
  );

  const totalToAdd = useMemo(
    () => Object.values(quantities).reduce((sum, q) => sum + (q > 0 ? q : 0), 0),
    [quantities],
  );

  const reset = () => {
    setSearch('');
    setQuantities({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const setSkuQty = (sku: string, qty: number) => {
    if (!bulto) return;
    const max = getMaxAddQtyForOrderLine(
      order,
      bulto,
      sku,
      pendingAdds.filter((p) => p.sku !== sku),
    );
    if (qty > max) showToast(maxReachedTooltip);
    const clamped = Math.max(0, Math.min(qty, max));
    setQuantities((prev) => {
      const next = { ...prev };
      if (clamped <= 0) {
        delete next[sku];
      } else {
        next[sku] = clamped;
      }
      return next;
    });
  };

  const handleAdd = () => {
    const items: AddItemEntry[] = displayList
      .filter((s) => (quantities[s.sku] ?? 0) > 0)
      .map((s) => ({
        sku: s.sku,
        name: s.name,
        qty: quantities[s.sku],
      }));
    if (items.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddItems(items);
    reset();
  };

  const renderRow = ({ item }: { item: Articulo }) => {
    const qty = quantities[item.sku] ?? 0;
    const maxAdd = bulto
      ? getMaxAddQtyForOrderLine(
          order,
          bulto,
          item.sku,
          pendingAdds.filter((p) => p.sku !== item.sku),
        )
      : 0;
    const canAdd = maxAdd > 0;

    const row = (
      <View style={[styles.row, !canAdd && styles.rowDisabled]}>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.rowSku}>{item.sku}</Text>
          <Text style={[styles.maxHint, !canAdd && styles.maxHintMuted]}>
            {canAdd
              ? t('picking.addItem.maxPerArticle', { max: maxAdd })
              : t('picking.addItem.noSpace')}
          </Text>
        </View>
        <QtyStepper
          value={qty}
          onChange={(v) => setSkuQty(item.sku, v)}
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
            {searchLoading ? (
              <ActivityIndicator size="small" color="#8E8E93" style={{ marginRight: 10 }} />
            ) : null}
          </View>
          {search.trim().length > 0 && search.trim().length < 2 ? (
            <Text style={styles.searchHint}>{t('picking.addItem.searchHint')}</Text>
          ) : null}
        </View>

        <FlatList
          data={displayList}
          keyExtractor={(i) => i.sku}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>
              {searchLoading ? '' : t('picking.addItem.noResults')}
            </Text>
          }
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
  searchRow: {
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
  searchHint: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 6,
    marginLeft: 4,
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
