import * as Haptics from 'expo-haptics';
import { ChevronDown, ChevronUp, Lock, Plus, Unlock } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import type { Bulto } from '../types';
import { BultoActionButton } from './bulto-action-button';
import { QtyStepper } from './qty-stepper';

interface BultoCardProps {
  bulto: Bulto;
  editable: boolean;
  capacityFull?: boolean;
  getItemMaxQty?: (itemId: string) => number;
  onCapacityExceeded?: () => void;
  onClose: (bultoId: string) => void;
  onReopen: (bultoId: string) => void;
  onAddItem: (bultoId: string) => void;
  onUpdateItemQty: (bultoId: string, itemId: string, qty: number) => void;
  onRemoveItem: (bultoId: string, itemId: string) => void;
}

export function BultoCard({
  bulto,
  editable,
  capacityFull = false,
  getItemMaxQty,
  onCapacityExceeded,
  onClose,
  onReopen,
  onAddItem,
  onUpdateItemQty,
  onRemoveItem,
}: BultoCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const isClosed = bulto.status === 'closed';

  return (
    <View style={[styles.card, isClosed ? styles.cardClosed : styles.cardOpen]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={[styles.header, isClosed ? styles.headerClosed : styles.headerOpen]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Text style={styles.headerTitle}>{t('picking.bulto.title', { number: bulto.number })}</Text>
          <View style={[styles.statusPill, isClosed ? styles.statusClosed : styles.statusOpen]}>
            <Text style={[styles.statusText, isClosed ? styles.statusTextClosed : styles.statusTextOpen]}>
              {isClosed ? t('picking.bulto.closed') : t('picking.bulto.open')}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.itemCount}>{t('picking.bulto.itemCount', { count: bulto.items.length })}</Text>
          {expanded ? (
            <ChevronUp size={18} color="#8E8E93" />
          ) : (
            <ChevronDown size={18} color="#8E8E93" />
          )}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {bulto.items.length === 0 ? (
            <Text style={styles.empty}>{t('picking.bulto.empty')}</Text>
          ) : (
            bulto.items.map((item, idx) => (
              <View
                key={item.id}
                style={[styles.itemRow, idx < bulto.items.length - 1 && styles.itemRowBorder]}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemSku}>{item.sku}</Text>
                </View>
                {editable && !isClosed ? (
                  <QtyStepper
                    value={item.qty}
                    min={0}
                    max={getItemMaxQty?.(item.id) ?? 9999}
                    onAtMax={onCapacityExceeded}
                    onChange={(qty) => {
                      if (qty < 1) {
                        Haptics.selectionAsync();
                        onRemoveItem(bulto.id, item.id);
                        return;
                      }
                      onUpdateItemQty(bulto.id, item.id, qty);
                    }}
                  />
                ) : (
                  <Text style={styles.itemQty}>×{item.qty}</Text>
                )}
              </View>
            ))
          )}

          {editable ? (
            <View style={styles.actions}>
              {!isClosed && !capacityFull ? (
                <BultoActionButton
                  label={t('picking.bulto.addItem')}
                  icon={Plus}
                  variant="filled"
                  onPress={() => {
                    Haptics.selectionAsync();
                    onAddItem(bulto.id);
                  }}
                />
              ) : null}
              <BultoActionButton
                label={isClosed ? t('picking.bulto.reopen') : t('picking.bulto.close')}
                icon={isClosed ? Unlock : Lock}
                variant="outline"
                onPress={() => {
                  Haptics.selectionAsync();
                  isClosed ? onReopen(bulto.id) : onClose(bulto.id);
                }}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardOpen: {
    borderColor: '#111827',
  },
  cardClosed: {
    borderColor: '#E5E5EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerOpen: {
    backgroundColor: '#F9FAFB',
  },
  headerClosed: {
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusOpen: {
    backgroundColor: '#111827',
  },
  statusClosed: {
    backgroundColor: '#E5E5EA',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextOpen: {
    color: '#FFFFFF',
  },
  statusTextClosed: {
    color: '#6B7280',
  },
  itemCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  empty: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#F3F4F6',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  itemSku: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  itemQty: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
});
