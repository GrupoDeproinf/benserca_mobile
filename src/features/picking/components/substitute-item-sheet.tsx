import * as Haptics from 'expo-haptics';
import { Plus, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Bulto, Order, OrderLine } from '../types';
import { MOCK_SKU_CATALOG, type MockSku } from '../data/mock-skus';
import { getActiveOrderLines, getMaxAddQtyForSku } from '../utils/bulto-capacity';
import { OrderActionButton } from './order-action-button';
import { QtyStepper } from './qty-stepper';

export interface SubstituteItemEntry {
  sku: string;
  name: string;
  qty: number;
  originalSku: string;
  substitutionNote?: string;
}

interface SubstituteItemSheetProps {
  visible: boolean;
  order: Order;
  originalLine: OrderLine | null;
  targetBulto: Bulto | null;
  onClose: () => void;
  onConfirm: (entry: SubstituteItemEntry) => void;
}

export function SubstituteItemSheet({
  visible,
  order,
  originalLine,
  targetBulto,
  onClose,
  onConfirm,
}: SubstituteItemSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [selectedSku, setSelectedSku] = useState<MockSku | null>(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const activeLines = getActiveOrderLines(order);

  const maxQty = useMemo(() => {
    if (!targetBulto || !originalLine || !selectedSku) return 0;
    return getMaxAddQtyForSku(
      targetBulto,
      activeLines,
      selectedSku.sku,
      [],
      originalLine.sku,
    );
  }, [targetBulto, activeLines, originalLine, selectedSku]);

  useEffect(() => {
    if (maxQty < 1) {
      setQty(0);
      return;
    }
    setQty((prev) => Math.min(Math.max(1, prev), maxQty));
  }, [maxQty, selectedSku?.sku]);

  const filtered = MOCK_SKU_CATALOG.filter(
    (s) =>
      s.sku !== originalLine?.sku &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.sku.toLowerCase().includes(search.toLowerCase())),
  );

  const reset = () => {
    setSearch('');
    setSelectedSku(null);
    setQty(1);
    setNote('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!originalLine || !selectedSku || qty < 1 || maxQty < 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm({
      sku: selectedSku.sku,
      name: selectedSku.name,
      qty,
      originalSku: originalLine.sku,
      ...(note.trim().length > 0 ? { substitutionNote: note.trim() } : {}),
    });
    reset();
  };

  const canConfirm = Boolean(selectedSku && maxQty > 0 && qty >= 1);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('picking.substitute.title')}</Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <X size={22} color="#8E8E93" />
          </Pressable>
        </View>

        {originalLine ? (
          <View style={styles.originalBox}>
            <Text style={styles.originalLabel}>{t('picking.substitute.original')}</Text>
            <Text style={styles.originalName}>{originalLine.name}</Text>
            <Text style={styles.originalSku}>{originalLine.sku}</Text>
          </View>
        ) : null}

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
          renderItem={({ item }) => {
            const maxAdd =
              targetBulto && originalLine
                ? getMaxAddQtyForSku(targetBulto, activeLines, item.sku, [], originalLine.sku)
                : 0;
            const canAdd = maxAdd > 0;

            return (
              <Pressable
                onPress={() => canAdd && setSelectedSku(item)}
                disabled={!canAdd}
                style={[
                  styles.row,
                  selectedSku?.sku === item.sku && styles.rowSelected,
                  !canAdd && styles.rowDisabled,
                ]}
              >
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
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.empty}>{t('picking.addItem.noResults')}</Text>}
        />

        <View style={[styles.footerPanel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.footerHandle} />

          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>{t('picking.addItem.qty')}</Text>
            <QtyStepper
              value={qty}
              onChange={(v) => setQty(maxQty > 0 ? Math.min(v, maxQty) : 0)}
              min={maxQty > 0 ? 1 : 0}
              max={maxQty > 0 ? maxQty : 1}
              size="medium"
              editable
              disabled={!selectedSku || maxQty < 1}
            />
          </View>

          <Text style={styles.noteLabel}>{t('picking.substitute.noteLabel')}</Text>
          <TextInput
            placeholder={t('picking.substitute.notePlaceholder')}
            placeholderTextColor="#8E8E93"
            value={note}
            onChangeText={setNote}
            multiline
            style={styles.noteInput}
          />

          <OrderActionButton
            label={t('picking.substitute.confirm')}
            onPress={handleConfirm}
            disabled={!canConfirm}
            icon={Plus}
            variant="primary"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  originalBox: {
    margin: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  originalLabel: { fontSize: 11, fontWeight: '600', color: '#B45309' },
  originalName: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 4 },
  originalSku: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
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
  list: { flex: 1, backgroundColor: '#F2F2F7' },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
  },
  rowSelected: { borderColor: '#111827', backgroundColor: '#F9FAFB' },
  rowDisabled: { opacity: 0.55 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowSku: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  maxHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  maxHintMuted: { color: '#9CA3AF' },
  separator: { height: 8 },
  empty: { textAlign: 'center', color: '#8E8E93', marginTop: 24, fontSize: 14 },
  footerPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: '#D1D1D6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  footerHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
    marginBottom: 2,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  noteLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 2 },
  noteInput: {
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCDCE0',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
  },
  qtyLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
});
