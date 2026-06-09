import * as Haptics from 'expo-haptics';
import { Plus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_SKU_CATALOG, type MockSku } from '../data/mock-skus';
import { OrderActionButton } from './order-action-button';
import { QtyStepper } from './qty-stepper';

export interface AddItemEntry {
  sku: string;
  name: string;
  qty: number;
}

interface AddItemSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddItems: (items: AddItemEntry[]) => void;
}

export function AddItemSheet({ visible, onClose, onAddItems }: AddItemSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const filtered = MOCK_SKU_CATALOG.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.sku.toLowerCase().includes(search.toLowerCase()),
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
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[sku];
      } else {
        next[sku] = qty;
      }
      return next;
    });
  };

  const handleAdd = () => {
    const items: AddItemEntry[] = MOCK_SKU_CATALOG.filter((s) => (quantities[s.sku] ?? 0) > 0).map(
      (s) => ({
        sku: s.sku,
        name: s.name,
        qty: quantities[s.sku],
      }),
    );
    if (items.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddItems(items);
    reset();
  };

  const renderRow = ({ item }: { item: MockSku }) => {
    const qty = quantities[item.sku] ?? 0;

    return (
      <View style={styles.row}>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.rowSku}>{item.sku}</Text>
        </View>
        <QtyStepper value={qty} onChange={(v) => setSkuQty(item.sku, v)} min={0} />
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('picking.addItem.title')}</Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <X size={22} color="#8E8E93" />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            placeholder={t('picking.addItem.searchPlaceholder')}
            placeholderTextColor="#8E8E93"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.sku}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('picking.addItem.noResults')}</Text>
          }
        />

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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
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
  searchInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCDCE0',
    backgroundColor: '#E9E9EB',
    paddingHorizontal: 14,
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
