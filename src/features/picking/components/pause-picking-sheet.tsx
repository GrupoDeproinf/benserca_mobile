import * as Haptics from 'expo-haptics';
import { Check, ChevronDown, PauseCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PauseReason } from '../types';
import type { MissingLineQty } from '../utils/order-snapshot';

interface PausePickingSheetProps {
  visible: boolean;
  /**
   * Solo los artículos que faltan por armar (ver `getMissingQuantities`). Un
   * artículo ya completo en los bultos no puede ser el motivo de la pausa, así
   * que no se ofrece.
   */
  pendingItems: MissingLineQty[];
  onClose: () => void;
  onConfirm: (reason: PauseReason, missingSkus: string[]) => void;
}

const REASONS: PauseReason[] = ['falta_articulo', 'cambio_prioridad'];

export function PausePickingSheet({
  visible,
  pendingItems,
  onClose,
  onConfirm,
}: PausePickingSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [selectOpen, setSelectOpen] = useState(false);
  const [reason, setReason] = useState<PauseReason | null>(null);
  /**
   * Selección por RENGLÓN: dos renglones del mismo SKU son pendientes distintos
   * y se marcan por separado. Lo que viaja a Firestore sigue siendo la lista de
   * SKUs (`missing_skus`), sin repetir.
   */
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setSelectOpen(false);
      setReason(null);
      setSelectedLines(new Set());
    }
  }, [visible]);

  const reasonLabel = (r: PauseReason) =>
    r === 'falta_articulo'
      ? t('picking.pause.reasonMissingItem')
      : t('picking.pause.reasonPriorityChange');

  const toggleLine = (lineId: string) => {
    Haptics.selectionAsync();
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const canConfirm = reason != null && (reason !== 'falta_articulo' || selectedLines.size > 0);

  const handleConfirm = () => {
    if (!canConfirm || !reason) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const skus = pendingItems.filter((i) => selectedLines.has(i.lineId)).map((i) => i.sku);
    onConfirm(reason, [...new Set(skus)]);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityRole="button" />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />

          <View style={styles.iconWrap}>
            <PauseCircle size={28} color="#B45309" strokeWidth={2} />
          </View>

          <Text style={styles.title}>{t('picking.pause.title')}</Text>
          <Text style={styles.message}>{t('picking.pause.subtitle')}</Text>

          <Text style={styles.fieldLabel}>{t('picking.pause.reasonLabel')}</Text>
          <Pressable
            onPress={() => setSelectOpen((prev) => !prev)}
            style={[styles.selectField, selectOpen && styles.selectFieldOpen]}
          >
            <Text style={[styles.selectValue, !reason && styles.selectPlaceholder]}>
              {reason ? reasonLabel(reason) : t('picking.pause.reasonPlaceholder')}
            </Text>
            <ChevronDown size={18} color="#6B7280" strokeWidth={2.2} />
          </Pressable>

          {selectOpen ? (
            <View style={styles.selectOptions}>
              {REASONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setReason(r);
                    setSelectOpen(false);
                    if (r !== 'falta_articulo') setSelectedLines(new Set());
                  }}
                  style={styles.selectOptionRow}
                >
                  <Text style={styles.selectOptionText}>{reasonLabel(r)}</Text>
                  {reason === r ? <Check size={16} color="#111827" strokeWidth={2.4} /> : null}
                </Pressable>
              ))}
            </View>
          ) : null}

          {reason === 'falta_articulo' ? (
            <View style={styles.checklistWrap}>
              <Text style={styles.fieldLabel}>{t('picking.pause.missingItemsLabel')}</Text>
              {pendingItems.length === 0 ? (
                <Text style={styles.checklistEmpty}>{t('picking.pause.noPendingItems')}</Text>
              ) : (
                <ScrollView style={styles.checklist} keyboardShouldPersistTaps="handled">
                  {pendingItems.map((item) => {
                    const checked = selectedLines.has(item.lineId);
                    return (
                      <Pressable
                        key={item.lineId}
                        onPress={() => toggleLine(item.lineId)}
                        style={[styles.checklistRow, checked && styles.checklistRowChecked]}
                      >
                        <View style={styles.checklistRowInfo}>
                          <Text style={styles.checklistRowName} numberOfLines={2}>
                            {item.name}
                          </Text>
                          <Text style={styles.checklistRowSku}>{item.sku}</Text>
                          <Text style={styles.checklistRowQty}>
                            {t('picking.pause.missingQty', {
                              missing: item.missing,
                              required: item.required,
                            })}
                          </Text>
                        </View>
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          {checked ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={handleClose}
              android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
              style={({ pressed }) => [styles.btnPressable, pressed && styles.pressed]}
            >
              <View style={[styles.btnSurface, styles.btnSecondarySurface]} collapsable={false}>
                <Text style={styles.btnSecondaryText}>{t('common.cancel')}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={!canConfirm}
              android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
              style={({ pressed }) => [
                styles.btnPressable,
                styles.btnConfirmWrap,
                pressed && !!canConfirm && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.btnSurface,
                  styles.btnPrimarySurface,
                  !canConfirm && styles.btnDisabledSurface,
                ]}
                collapsable={false}
              >
                <Text style={styles.btnPrimaryText}>{t('picking.pause.confirm')}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5EA',
    marginBottom: 20,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#FEF3C7',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
  },
  selectFieldOpen: {
    borderColor: '#111827',
  },
  selectValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  selectPlaceholder: {
    color: '#8E8E93',
    fontWeight: '400',
  },
  selectOptions: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  selectOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#F3F4F6',
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  checklistWrap: {
    marginTop: 16,
  },
  checklist: {
    maxHeight: 220,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    marginBottom: 8,
  },
  checklistRowChecked: {
    borderColor: '#111827',
    backgroundColor: '#F9FAFB',
  },
  checklistRowInfo: { flex: 1, minWidth: 0, marginRight: 10 },
  checklistRowName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  checklistRowSku: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  checklistRowQty: { fontSize: 11, fontWeight: '700', color: '#B45309', marginTop: 4 },
  checklistEmpty: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
  },
  btnPressable: {
    flexShrink: 0,
  },
  btnConfirmWrap: {
    marginLeft: 'auto',
  },
  btnSurface: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  btnPrimarySurface: {
    backgroundColor: '#111827',
  },
  btnDisabledSurface: {
    backgroundColor: '#D1D5DB',
  },
  btnSecondarySurface: {
    backgroundColor: '#E9E9EB',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  pressed: {
    opacity: 0.88,
  },
});
