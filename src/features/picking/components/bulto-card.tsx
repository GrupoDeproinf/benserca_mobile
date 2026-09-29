import * as Haptics from 'expo-haptics';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Lock,
  Plus,
  Square,
  SquareCheck,
  Trash2,
  Unlock,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ExpandableText } from '@/shared/components/ui/expandable-text';
import { Text } from '@/shared/components/ui/text';
import type { Bulto, BultoItem } from '../types';
import { BultoActionButton } from './bulto-action-button';
import { QtyStepper } from './qty-stepper';

interface BultoCardProps {
  bulto: Bulto;
  editable: boolean;
  getItemMaxQty?: (itemId: string) => number;
  onCapacityExceeded?: () => void;
  onClose: (bultoId: string) => void;
  onReopen: (bultoId: string) => void;
  onAddItem: (bultoId: string) => void;
  onUpdateItemQty: (bultoId: string, itemId: string, qty: number) => void;
  onRemoveItem: (bultoId: string, itemId: string) => void;
  /** Solo se ofrece con el bulto vacío; sin él no se muestra el botón. */
  onDelete?: (bultoId: string) => void;
  /** Abre la vista previa (foto + código) del renglón dueño del ítem. */
  onPreviewItem?: (lineId: string) => void;
  /**
   * Arranca desplegado. En pedidos con muchos bultos se pasa `false`: montar
   * todos los ítems de todos los bultos a la vez es lo que dispara la memoria
   * (ver `MANY_BULTOS` en picking-detail.screen).
   */
  defaultExpanded?: boolean;
  /**
   * Modo selección (borrado múltiple): tocar la cabecera marca o desmarca el
   * bulto y se ocultan las acciones de edición para no mezclar gestos.
   */
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (bultoId: string) => void;
  /**
   * Mantener presionada la cabecera entra al modo selección con este bulto ya
   * marcado. Sin él, el gesto no hace nada.
   */
  onLongPressSelect?: (bultoId: string) => void;
  /**
   * Con el bulto seleccionado, su número se vuelve editable: escribir otro lo
   * mueve a esa posición (el número es la posición en la lista). Sin él, o con
   * `maxNumber` < 2, el número se muestra fijo.
   */
  onRenumber?: (bultoId: string, targetNumber: number) => void;
  /** Total de bultos del pedido: el número más alto que se puede escribir. */
  maxNumber?: number;
}

export function BultoCard({
  bulto,
  editable,
  getItemMaxQty,
  onCapacityExceeded,
  onClose,
  onReopen,
  onAddItem,
  onUpdateItemQty,
  onRemoveItem,
  onDelete,
  onPreviewItem,
  defaultExpanded = true,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onLongPressSelect,
  onRenumber,
  maxNumber = 0,
}: BultoCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isClosed = bulto.status === 'closed';
  // El tacho se ofrece en cualquier bulto (vacío, con ítems, abierto o
  // cerrado): el borrado en sí lo controla la pantalla, que pide
  // confirmación cuando hay ítems de por medio (ver `handleDeleteSingleBulto`
  // en picking-detail.screen). Con el bulto vacío no hace falta confirmar
  // porque no hay nada que perder.
  const canDelete = !selectionMode && editable && Boolean(onDelete);
  const rowsEditable = !selectionMode && editable && !isClosed;
  const showActions = !selectionMode && editable;

  /**
   * NO se agrupan los ítems por SKU. Dos renglones del mismo artículo (el
   * "20 + 2" de Profit) son cantidades independientes —máximo 20 y máximo 2, no
   * 22— y el picker sube y baja cada una por su cuenta. Fundirlas en una sola
   * fila perdería justamente esa separación.
   */
  const rows = bulto.items;

  const numberEditable = selectionMode && selected && Boolean(onRenumber) && maxNumber > 1;
  const [numberDraft, setNumberDraft] = useState(String(bulto.number));
  // Tras mover (o si otro bulto se movió y corrió a este) el campo vuelve a
  // mostrar el número real.
  useEffect(() => {
    setNumberDraft(String(bulto.number));
  }, [bulto.number, numberEditable]);

  const commitNumber = () => {
    const target = Number.parseInt(numberDraft, 10);
    if (!Number.isInteger(target) || target < 1 || target > maxNumber || target === bulto.number) {
      setNumberDraft(String(bulto.number));
      return;
    }
    onRenumber?.(bulto.id, target);
  };

  return (
    <View
      style={[
        styles.card,
        isClosed ? styles.cardClosed : styles.cardOpen,
        selectionMode && selected && styles.cardSelected,
      ]}
    >
      <Pressable
        onPress={() => {
          if (selectionMode) {
            Haptics.selectionAsync();
            onToggleSelect?.(bulto.id);
            return;
          }
          setExpanded((v) => !v);
        }}
        onLongPress={
          !selectionMode && onLongPressSelect
            ? () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onLongPressSelect(bulto.id);
              }
            : undefined
        }
        delayLongPress={350}
        accessibilityRole={selectionMode ? 'checkbox' : 'button'}
        accessibilityState={selectionMode ? { checked: selected } : { expanded }}
        style={[
          styles.header,
          isClosed ? styles.headerClosed : styles.headerOpen,
          selectionMode && selected && styles.headerSelected,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {selectionMode ? (
            selected ? (
              <SquareCheck size={20} color="#DC2626" strokeWidth={2.2} />
            ) : (
              <Square size={20} color="#8E8E93" strokeWidth={2.2} />
            )
          ) : null}
          {numberEditable ? (
            <View style={styles.numberEditRow}>
              <Text style={styles.headerTitle}>{t('picking.bulto.numberPrefix')}</Text>
              <TextInput
                value={numberDraft}
                onChangeText={(v) => setNumberDraft(v.replace(/[^0-9]/g, ''))}
                onEndEditing={commitNumber}
                onSubmitEditing={commitNumber}
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={4}
                selectTextOnFocus
                accessibilityLabel={t('picking.bulto.renumberInputLabel')}
                style={styles.numberInput}
              />
            </View>
          ) : (
            <Text style={styles.headerTitle}>
              {t('picking.bulto.title', { number: bulto.number })}
            </Text>
          )}
          <View style={[styles.statusPill, isClosed ? styles.statusClosed : styles.statusOpen]}>
            <Text
              style={[
                styles.statusText,
                isClosed ? styles.statusTextClosed : styles.statusTextOpen,
              ]}
            >
              {isClosed ? t('picking.bulto.closed') : t('picking.bulto.open')}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.itemCount}>
            {t('picking.bulto.itemCount', { count: rows.length })}
          </Text>
          {canDelete ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDelete?.(bulto.id);
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('picking.bulto.deleteBulto')}
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
            >
              <Trash2 size={16} color="#DC2626" strokeWidth={2.2} />
            </Pressable>
          ) : null}
          {selectionMode ? null : expanded ? (
            <ChevronUp size={18} color="#8E8E93" />
          ) : (
            <ChevronDown size={18} color="#8E8E93" />
          )}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {rows.length === 0 ? (
            <Text style={styles.empty}>{t('picking.bulto.empty')}</Text>
          ) : (
            rows.map((item, idx) => (
              <BultoItemRow
                key={item.id}
                item={item}
                bultoId={bulto.id}
                isLast={idx === rows.length - 1}
                editable={rowsEditable}
                // Solo se calcula donde se usa: una fila no editable no tiene stepper.
                max={rowsEditable ? (getItemMaxQty?.(item.id) ?? 9999) : 0}
                onCapacityExceeded={onCapacityExceeded}
                onUpdateItemQty={onUpdateItemQty}
                onRemoveItem={onRemoveItem}
                onPreviewItem={onPreviewItem}
              />
            ))
          )}

          {showActions ? (
            <View style={styles.actions}>
              {!isClosed ? (
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

interface BultoItemRowProps {
  item: BultoItem;
  bultoId: string;
  isLast: boolean;
  editable: boolean;
  max: number;
  onCapacityExceeded?: () => void;
  onUpdateItemQty: (bultoId: string, itemId: string, qty: number) => void;
  onRemoveItem: (bultoId: string, itemId: string) => void;
  onPreviewItem?: (lineId: string) => void;
}

/**
 * Fila de un ítem dentro del bulto. Componente propio (y con los handlers
 * armados aquí adentro, no en el `.map` del bulto) para que React Compiler la
 * memorice por sus props: al tocar el stepper de un ítem, el resto de las
 * filas del bulto conservan las suyas y no se redibujan.
 */
function BultoItemRow({
  item,
  bultoId,
  isLast,
  editable,
  max,
  onCapacityExceeded,
  onUpdateItemQty,
  onRemoveItem,
  onPreviewItem,
}: BultoItemRowProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.itemRow, !isLast && styles.itemRowBorder]}>
      <View style={{ flex: 1, marginRight: 8 }}>
        <ExpandableText style={styles.itemName} numberOfLines={1}>
          {item.name}
        </ExpandableText>
        <Text style={styles.itemSku}>{item.sku}</Text>
      </View>
      {onPreviewItem ? (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onPreviewItem(item.lineId);
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('picking.skuPreview.open')}
          style={({ pressed }) => [styles.eyeBtn, pressed && { opacity: 0.5 }]}
        >
          <Eye size={18} color="#8E8E93" strokeWidth={2.2} />
        </Pressable>
      ) : null}
      {editable ? (
        <QtyStepper
          value={item.qty}
          min={0}
          max={max}
          editable
          onAtMax={onCapacityExceeded}
          onChange={(qty) => {
            if (qty < 1) {
              Haptics.selectionAsync();
              onRemoveItem(bultoId, item.id);
              return;
            }
            onUpdateItemQty(bultoId, item.id, qty);
          }}
        />
      ) : (
        <Text style={styles.itemQty}>×{item.qty}</Text>
      )}
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
  cardSelected: {
    borderColor: '#DC2626',
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
  headerSelected: {
    backgroundColor: '#FEF2F2',
  },
  numberEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  numberInput: {
    minWidth: 48,
    height: 34,
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
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
  deleteBtn: {
    padding: 2,
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
  eyeBtn: {
    padding: 2,
    marginRight: 8,
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
});
