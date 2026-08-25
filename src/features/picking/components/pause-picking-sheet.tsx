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
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MissingItemsMode, PauseReason } from '../types';
import type { MissingLineQty } from '../utils/order-snapshot';

/** Renglón marcado como faltante junto con cuánto hay realmente en almacén. */
export interface MarkedMissingLine {
  lineId: string;
  availableQty: number;
}

interface PausePickingSheetProps {
  visible: boolean;
  /**
   * Solo los artículos que faltan por armar (ver `getMissingQuantities`). Un
   * artículo ya completo en los bultos no puede ser el motivo de la pausa, así
   * que no se ofrece.
   */
  pendingItems: MissingLineQty[];
  /**
   * Fija el motivo y oculta el selector. Se usa al entrar desde un renglón
   * concreto de la lista de artículos, donde el motivo solo puede ser faltante.
   */
  lockedReason?: PauseReason;
  /** Renglón que viene pre-marcado (el que tocó el picker en la lista). */
  focusLineId?: string;
  /**
   * El pedido ya tiene un faltante esperando resolución. Habilita pausar sin
   * marcar nada nuevo: es la única salida que le queda al picker cuando terminó
   * de armar y la oficina todavía no resolvió.
   */
  alreadyReported?: boolean;
  onClose: () => void;
  /**
   * `marked` viene vacío con motivo `cambio_prioridad`: ahí no hay faltantes y
   * `mode` siempre es `'pause'`.
   */
  onConfirm: (reason: PauseReason, marked: MarkedMissingLine[], mode: MissingItemsMode) => void;
}

const REASONS: PauseReason[] = ['falta_articulo', 'cambio_prioridad'];

/**
 * Cuánto hay en almacén: entero entre 0 y `required - 1`. El tope es
 * `required - 1` porque si hay todo lo pedido no es un faltante.
 */
function parseAvailable(raw: string, required: number): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (n < 0 || n > required - 1) return null;
  return n;
}

export function PausePickingSheet({
  visible,
  pendingItems,
  lockedReason,
  focusLineId,
  alreadyReported = false,
  onClose,
  onConfirm,
}: PausePickingSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [selectOpen, setSelectOpen] = useState(false);
  const [reason, setReason] = useState<PauseReason | null>(null);
  /**
   * Selección por RENGLÓN: dos renglones del mismo SKU son pendientes distintos
   * y se marcan por separado.
   */
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  /** Texto crudo del input por renglón; se valida al confirmar. */
  const [availableByLine, setAvailableByLine] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setSelectOpen(false);
      setReason(lockedReason ?? null);
      setSelectedLines(focusLineId ? new Set([focusLineId]) : new Set());
      setAvailableByLine({});
    }
  }, [visible, lockedReason, focusLineId]);

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

  const markedLines: MarkedMissingLine[] = pendingItems.flatMap((item) => {
    if (!selectedLines.has(item.lineId)) return [];
    const available = parseAvailable(availableByLine[item.lineId] ?? '', item.required);
    return available == null ? [] : [{ lineId: item.lineId, availableQty: available }];
  });

  const isMissingReason = reason === 'falta_articulo';
  /**
   * Hay algo nuevo que reportar: al menos un renglón marcado Y todos los
   * marcados con una cantidad válida (si uno quedó a medias no se confirma).
   */
  const canReport = selectedLines.size > 0 && markedLines.length === selectedLines.size;
  /**
   * Pausar sin reportar nada nuevo. Solo cuando el pedido ya tiene un faltante
   * pendiente y no queda nada por marcar: ahí pausar es la única salida.
   */
  const canPauseOnly = isMissingReason && alreadyReported && selectedLines.size === 0;

  const canContinue = isMissingReason && canReport;
  const canPause = isMissingReason ? canReport || canPauseOnly : reason != null;

  const handleConfirm = (mode: MissingItemsMode) => {
    if (!reason) return;
    if (mode === 'continue' ? !canContinue : !canPause) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onConfirm(reason, isMissingReason ? markedLines : [], isMissingReason ? mode : 'pause');
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

          <Text style={styles.title}>
            {lockedReason ? t('picking.missing.title') : t('picking.pause.title')}
          </Text>
          <Text style={styles.message}>
            {lockedReason ? t('picking.missing.subtitle') : t('picking.pause.subtitle')}
          </Text>

          {lockedReason ? null : (
            <>
              <Text style={styles.fieldLabel}>{t('picking.pause.reasonLabel')}</Text>
              <Pressable
                onPress={() => setSelectOpen((v) => !v)}
                style={[styles.selectField, selectOpen && styles.selectFieldOpen]}
              >
                <Text style={[styles.selectValue, !reason && styles.selectPlaceholder]}>
                  {reason ? reasonLabel(reason) : t('picking.pause.reasonPlaceholder')}
                </Text>
                <ChevronDown size={18} color="#8E8E93" strokeWidth={2.2} />
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
                      }}
                      style={styles.selectOptionRow}
                    >
                      <Text style={styles.selectOptionText}>{reasonLabel(r)}</Text>
                      {reason === r ? <Check size={16} color="#111827" strokeWidth={2.4} /> : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          )}

          {isMissingReason ? (
            <View style={styles.checklistWrap}>
              <Text style={styles.fieldLabel}>{t('picking.missing.listLabel')}</Text>
              {pendingItems.length === 0 ? (
                <Text style={styles.checklistEmpty}>{t('picking.pause.noPendingItems')}</Text>
              ) : (
                <ScrollView style={styles.checklist} keyboardShouldPersistTaps="handled">
                  {pendingItems.map((item) => {
                    const checked = selectedLines.has(item.lineId);
                    const raw = availableByLine[item.lineId] ?? '';
                    const invalid =
                      checked &&
                      raw.trim().length > 0 &&
                      parseAvailable(raw, item.required) == null;
                    return (
                      <View
                        key={item.lineId}
                        style={[styles.checklistRow, checked && styles.checklistRowChecked]}
                      >
                        <Pressable
                          onPress={() => toggleLine(item.lineId)}
                          style={styles.checklistRowMain}
                        >
                          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                            {checked ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
                          </View>
                          <View style={styles.checklistRowInfo}>
                            <Text style={styles.checklistRowName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.checklistRowSku}>{item.sku}</Text>
                          </View>
                        </Pressable>

                        {checked ? (
                          <View style={styles.qtyRow}>
                            <Text style={styles.qtyPrefix}>
                              {t('picking.missing.availableShort')}
                            </Text>
                            <TextInput
                              value={raw}
                              onChangeText={(v) =>
                                setAvailableByLine((prev) => ({
                                  ...prev,
                                  [item.lineId]: v.replace(/[^0-9]/g, ''),
                                }))
                              }
                              keyboardType="number-pad"
                              placeholder="0"
                              placeholderTextColor="#C7C7CC"
                              maxLength={5}
                              style={[styles.qtyInput, invalid && styles.qtyInputError]}
                              accessibilityLabel={t('picking.missing.availableLabel')}
                            />
                            <Text style={styles.qtyOf} numberOfLines={1}>
                              {t('picking.missing.availableOf', { required: item.required })}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          ) : null}

          {canPauseOnly ? (
            <Text style={styles.warning}>{t('picking.missing.pauseOnlyHint')}</Text>
          ) : null}

          {isMissingReason ? (
            <View style={styles.actionsWrap}>
              <View style={styles.actionsRow}>
                {/*
                  El flex va en el slot (View), no en el Pressable: en Android
                  el estilo-función de Pressable ignora flexGrow/flexBasis y
                  el botón se queda del ancho del texto.
                */}
                <View style={styles.btnSlot}>
                  <Pressable
                    onPress={() => handleConfirm('pause')}
                    disabled={!canPause}
                    android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                    style={styles.btnPressableFill}
                  >
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.btnSurface,
                          styles.btnSurfaceFill,
                          styles.btnSecondarySurface,
                          !canPause && styles.btnDisabledSurface,
                          pressed && canPause && styles.pressed,
                        ]}
                        collapsable={false}
                      >
                        <Text
                          style={[styles.btnSecondaryText, !canPause && styles.btnDisabledText]}
                          numberOfLines={1}
                        >
                          {t('picking.missing.pauseBtn')}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>

                <View style={styles.btnSlot}>
                  <Pressable
                    onPress={() => handleConfirm('continue')}
                    disabled={!canContinue}
                    android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                    style={styles.btnPressableFill}
                  >
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.btnSurface,
                          styles.btnSurfaceFill,
                          styles.btnPrimarySurface,
                          !canContinue && styles.btnDisabledSurface,
                          pressed && canContinue && styles.pressed,
                        ]}
                        collapsable={false}
                      >
                        <Text
                          style={[styles.btnPrimaryText, !canContinue && styles.btnDisabledText]}
                          numberOfLines={1}
                        >
                          {t('picking.missing.continueBtn')}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>

              <Pressable onPress={handleClose} style={styles.btnGhost}>
                <Text style={styles.btnGhostText}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
          ) : (
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
                onPress={() => handleConfirm('pause')}
                disabled={!canPause}
                android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                style={({ pressed }) => [
                  styles.btnPressable,
                  styles.btnConfirmWrap,
                  pressed && canPause && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.btnSurface,
                    styles.btnPrimarySurface,
                    !canPause && styles.btnDisabledSurface,
                  ]}
                  collapsable={false}
                >
                  <Text style={styles.btnPrimaryText}>{t('picking.pause.confirm')}</Text>
                </View>
              </Pressable>
            </View>
          )}
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
    maxHeight: 260,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  /** Zona que alterna la marca: checkbox + nombre. El input queda fuera. */
  checklistRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  checklistRowInfo: { flex: 1, minWidth: 0 },
  checklistRowName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  checklistRowSku: { fontSize: 11, color: '#8E8E93', marginTop: 1 },
  checklistEmpty: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    // Manda el nombre del artículo al truncarse, no el input.
    flexShrink: 0,
  },
  qtyPrefix: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  qtyInput: {
    width: 52,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  qtyInputError: {
    borderColor: '#DC2626',
  },
  qtyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  qtyOf: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  warning: {
    fontSize: 12,
    lineHeight: 17,
    color: '#B45309',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  actionsWrap: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  btnSlot: {
    flex: 1,
    minWidth: 0,
  },
  btnPressableFill: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnGhost: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnGhostText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
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
  btnSurfaceFill: {
    width: '100%',
    paddingHorizontal: 8,
  },
  btnPrimarySurface: {
    backgroundColor: '#111827',
  },
  btnDisabledSurface: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  /**
   * Sin esto el botón primario deshabilitado queda con texto blanco sobre gris
   * claro: se lee como si el botón no estuviera.
   */
  btnDisabledText: {
    color: '#9CA3AF',
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
