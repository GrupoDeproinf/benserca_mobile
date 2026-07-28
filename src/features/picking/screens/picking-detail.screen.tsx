import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeftRight,
  Box,
  ClipboardList,
  type LucideIcon,
  Package,
  PackageOpen,
  PackagePlus,
  PauseCircle,
  Play,
  RotateCcw,
  Trash2,
  Truck,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { ConfirmSheet, type ConfirmSheetTone } from '@/shared/components/ui/confirm-sheet';
import { Text } from '@/shared/components/ui/text';
import { Toast, useToast } from '@/shared/components/ui/toast';
import { type AddItemEntry, AddItemSheet } from '../components/add-item-sheet';
import { BultoCard } from '../components/bulto-card';
import {
  estimateOrderActionsHeight,
  type OrderDetailAction,
  OrderDetailActions,
} from '../components/order-detail-action-bar';
import { OrderDetailAlertBanner, OrderDetailHeader } from '../components/order-detail-header';
import { OrderDetailCard, OrderDetailSection } from '../components/order-detail-section';
import { OrderDetailBodyFade } from '../components/order-detail-transition';
import { PausePickingSheet } from '../components/pause-picking-sheet';
import { PickingProgressBar } from '../components/picking-progress-bar';
import { SubstituteItemSheet } from '../components/substitute-item-sheet';
import { useOrdersStore } from '../store/orders.store';
import type { OrderLine, PauseReason } from '../types';
import { getMaxQtyForBultoItem } from '../utils/bulto-capacity';
import { getAssignedQtyForLine, getMissingQuantities } from '../utils/order-snapshot';
import { getEffectiveQueuePosition } from '../utils/picker-queue';

interface PickingDetailScreenProps {
  orderId: string;
  /** Modo visualizador (supervisor de almacén): oculta toda acción y edición. */
  readOnly?: boolean;
}

const SCREEN_BG = '#F2F2F7';

type ConfirmState = {
  title: string;
  message: string;
  messageItems?: string[];
  mode: 'confirm' | 'info';
  tone?: ConfirmSheetTone;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  icon?: LucideIcon;
  /** Obligatorio elegir una acción; no cierra al tocar fuera. */
  dismissible?: boolean;
};

const EMPTY_PICKER_ORDERS: never[] = [];

export function PickingDetailScreen({ orderId, readOnly = false }: PickingDetailScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();

  const allOrders = useOrdersStore((s) => s.orders);
  const order = useMemo(
    () => allOrders.find((o) => o.id === orderId),
    [allOrders, orderId],
  );
  const pickerOrders = useMemo(() => {
    if (!user) return EMPTY_PICKER_ORDERS;
    return allOrders.filter(
      (o) => o.assignedPickerId === user.uid || o.teamPickerUids.includes(user.uid),
    );
  }, [allOrders, user?.uid]);
  const effectiveQueuePosition = useMemo(() => {
    if (!order) return null;
    return getEffectiveQueuePosition(order, pickerOrders);
  }, [order, pickerOrders]);
  const startPicking = useOrdersStore((s) => s.startPicking);
  const finishPicking = useOrdersStore((s) => s.finishPicking);
  const markWrapped = useOrdersStore((s) => s.markWrapped);
  const markDispatched = useOrdersStore((s) => s.markDispatched);
  const reopenForRevision = useOrdersStore((s) => s.reopenForRevision);
  const openBulto = useOrdersStore((s) => s.openBulto);
  const closeBulto = useOrdersStore((s) => s.closeBulto);
  const reopenBulto = useOrdersStore((s) => s.reopenBulto);
  const deleteBulto = useOrdersStore((s) => s.deleteBulto);
  const addBultoItem = useOrdersStore((s) => s.addBultoItem);
  const removeBultoItem = useOrdersStore((s) => s.removeBultoItem);
  const updateBultoItem = useOrdersStore((s) => s.updateBultoItem);
  const pausePicking = useOrdersStore((s) => s.pausePicking);
  const resumePicking = useOrdersStore((s) => s.resumePicking);

  const [addSheetBultoId, setAddSheetBultoId] = useState<string | null>(null);
  const [substituteLine, setSubstituteLine] = useState<OrderLine | null>(null);
  const [pauseSheetVisible, setPauseSheetVisible] = useState(false);
  const [confirmSheet, setConfirmSheet] = useState<ConfirmState | null>(null);
  const { message: capacityToast, nudgeToken: capacityToastNudge, show: showCapacityToast } =
    useToast();
  const maxReachedTooltip = t('picking.addItem.capacityExceededTooltip');

  if (!order) {
    return (
      <View style={[styles.centered, { backgroundColor: SCREEN_BG }]}>
        <Text>{t('picking.detail.notFound')}</Text>
      </View>
    );
  }

  if (!user) return null;

  const isEditable =
    !readOnly && (order.status === 'in_progress' || order.status === 'rejected_review');
  const showBultos =
    order.status === 'in_progress' ||
    order.status === 'to_pack' ||
    order.status === 'rejected_review' ||
    order.status === 'packed' ||
    order.status === 'audited';

  const lastObservation = order.auditObservations[order.auditObservations.length - 1];
  const closedBultos = order.bultos.filter((b) => b.status === 'closed' && b.items.length > 0).length;

  const performOpenBulto = () => {
    const result = openBulto(order.id);
    if (!result.ok) {
      setConfirmSheet({
        title: t('picking.bulto.emptyOpenBlockTitle'),
        message: t('picking.bulto.emptyOpenBlockBody'),
        mode: 'info',
        tone: 'warning',
        confirmLabel: t('common.understood'),
        icon: PackagePlus,
      });
      return;
    }
    Haptics.selectionAsync();
    if (result.isExtra) {
      setConfirmSheet({
        title: t('picking.extraBultos.title'),
        message: t('picking.extraBultos.body', { defined: order.definedBultos }),
        mode: 'info',
        tone: 'warning',
        confirmLabel: t('common.understood'),
        icon: PackagePlus,
      });
    }
  };

  const handleOpenBulto = () => {
    const wouldBeExtra = order.bultos.length >= order.definedBultos;
    if (wouldBeExtra) {
      setConfirmSheet({
        title: t('picking.extraBultos.confirmTitle'),
        message: t('picking.extraBultos.confirmBody', { defined: order.definedBultos }),
        mode: 'confirm',
        tone: 'warning',
        confirmLabel: t('picking.extraBultos.continue'),
        icon: PackagePlus,
        onConfirm: performOpenBulto,
      });
      return;
    }
    performOpenBulto();
  };

  const handleStartPicking = () => {
    const result = startPicking(order.id, user.uid);
    if (!result.ok) {
      setConfirmSheet({
        title: t('picking.queue.blockTitle'),
        message: t('picking.queue.alreadyActive'),
        mode: 'info',
        confirmLabel: t('common.understood'),
        icon: AlertCircle,
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const showEmptyBultoBlock = (bultoNumber?: number) => {
    setConfirmSheet({
      title: t('picking.finish.emptyBlockTitle'),
      message:
        bultoNumber != null
          ? t('picking.finish.emptyBlockBody', { number: bultoNumber })
          : t('picking.finish.emptyBlockBodyGeneric'),
      mode: 'info',
      tone: 'warning',
      confirmLabel: t('common.understood'),
      icon: PackageOpen,
    });
  };

  const showNoBultosBlock = () => {
    setConfirmSheet({
      title: t('picking.finish.noBultosTitle'),
      message: t('picking.finish.noBultosBody'),
      mode: 'info',
      tone: 'warning',
      confirmLabel: t('common.understood'),
      icon: PackageOpen,
    });
  };

  const doFinishPicking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const result = finishPicking(order.id, user.uid);
    if (!result.ok && result.error === 'empty_open_bulto_exists') {
      const emptyOpen = order.bultos.find((b) => b.status === 'open' && b.items.length === 0);
      showEmptyBultoBlock(emptyOpen?.number);
    } else if (!result.ok && result.error === 'no_bultos') {
      showNoBultosBlock();
    }
  };

  const handleFinishPicking = () => {
    if (order.bultos.length === 0) {
      showNoBultosBlock();
      return;
    }

    const emptyOpen = order.bultos.find((b) => b.status === 'open' && b.items.length === 0);
    if (emptyOpen) {
      showEmptyBultoBlock(emptyOpen.number);
      return;
    }

    const missing = getMissingQuantities(order);
    if (missing.length > 0) {
      const items = missing.map((m) =>
        t('picking.finish.missingLine', { qty: m.missing, name: m.name }),
      );
      setConfirmSheet({
        title: t('picking.finish.missingTitle'),
        message: t('picking.finish.missingBody'),
        messageItems: items,
        mode: 'confirm',
        tone: 'warning',
        confirmLabel: t('picking.finish.missingConfirm'),
        icon: PackageOpen,
        onConfirm: doFinishPicking,
      });
      return;
    }

    setConfirmSheet({
      title: t('picking.finish.confirmTitle'),
      message: t('picking.finish.confirmBody'),
      mode: 'confirm',
      confirmLabel: t('picking.finish.confirm'),
      icon: PackageOpen,
      onConfirm: doFinishPicking,
    });
  };

  const handleMarkWrapped = () => {
    setConfirmSheet({
      title: t('picking.wrap.confirmTitle'),
      message: t('picking.wrap.confirmBody'),
      mode: 'confirm',
      confirmLabel: t('picking.wrap.confirm'),
      icon: Box,
      onConfirm: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        markWrapped(order.id);
      },
    });
  };

  const handleMarkDispatched = () => {
    setConfirmSheet({
      title: t('picking.dispatch.confirmTitle'),
      message: t('picking.dispatch.confirmBody'),
      mode: 'confirm',
      confirmLabel: t('picking.dispatch.confirm'),
      icon: Truck,
      onConfirm: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        markDispatched(order.id);
      },
    });
  };

  const handleReopenForRevision = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reopenForRevision(order.id, user.uid);
  };

  const handlePausePicking = () => {
    Haptics.selectionAsync();
    setPauseSheetVisible(true);
  };

  const handleConfirmPause = (reason: PauseReason, missingSkus: string[]) => {
    pausePicking(order.id, reason, missingSkus);
    setPauseSheetVisible(false);
  };

  const handleResumePicking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resumePicking(order.id);
  };

  const handleCloseBulto = (bultoId: string) => {
    const result = closeBulto(order.id, bultoId);
    if (!result.ok) {
      setConfirmSheet({
        title: t('picking.bulto.cannotCloseEmptyTitle'),
        message: t('picking.bulto.cannotCloseEmptyBody'),
        mode: 'info',
        confirmLabel: t('common.understood'),
        icon: PackageOpen,
      });
    }
  };

  const showEmptyBultoModal = (bultoId: string, bultoNumber: number) => {
    setConfirmSheet({
      title: t('picking.bulto.emptyModalTitle', { number: bultoNumber }),
      message: t('picking.bulto.emptyModalBody'),
      mode: 'confirm',
      tone: 'warning',
      confirmLabel: t('picking.bulto.deleteBulto'),
      cancelLabel: t('picking.bulto.addItem'),
      icon: Trash2,
      dismissible: false,
      onConfirm: () => deleteBulto(order.id, bultoId),
      onCancel: () => setAddSheetBultoId(bultoId),
    });
  };

  const handleRemoveItem = (bultoId: string, itemId: string) => {
    const result = removeBultoItem(order.id, bultoId, itemId);
    if (result.bultoEmpty) {
      showEmptyBultoModal(result.bultoId, result.bultoNumber);
    }
  };

  const commitAddItems = (
    bultoId: string,
    items: AddItemEntry[],
    options?: { originalSku?: string; substitutionNote?: string },
  ) => {
    items.forEach(({ sku, name, qty }) => {
      addBultoItem(order.id, bultoId, sku, name, qty, options);
    });
    setAddSheetBultoId(null);
    setSubstituteLine(null);
  };

  const handleAddItemToBulto = (bultoId: string) => {
    const bulto = order.bultos.find((b) => b.id === bultoId);
    if (!bulto) return;
    setAddSheetBultoId(bultoId);
  };

  // Reanudar picking está disponible para cualquier rol que pueda ver el
  // pedido pausado (incluido supervisor_almacen en modo readOnly): la pausa
  // es la única acción que un visualizador puede ejecutar.
  const footerActions: (OrderDetailAction | OrderDetailAction[])[] = (() => {
    if (order.isPaused) {
      return [
        {
          label: t('picking.detail.resumePicking'),
          onPress: handleResumePicking,
          variant: 'primary',
          icon: Play,
        },
      ];
    }

    if (readOnly) return [];

    switch (order.status) {
      case 'assigned':
        return [
          {
            label: t('picking.detail.startPicking'),
            onPress: handleStartPicking,
            variant: 'primary',
            icon: Play,
          },
        ];
      case 'in_progress':
        return [
          {
            label: t('picking.detail.openBulto'),
            onPress: handleOpenBulto,
            variant: 'secondary',
            icon: PackagePlus,
          },
          [
            {
              label: t('picking.detail.pausePicking'),
              onPress: handlePausePicking,
              variant: 'secondary',
              icon: PauseCircle,
            },
            {
              label: t('picking.detail.finishPicking'),
              onPress: handleFinishPicking,
              variant: 'primary',
              icon: PackageOpen,
            },
          ],
        ];
      case 'to_pack':
        // Auditoría obligatoria: el picker no puede embalar directamente desde
        // Empaquetado; debe esperar la aprobación del chequeador.
        return [];
      case 'audited':
        return [
          {
            label: t('picking.detail.markWrapped'),
            onPress: handleMarkWrapped,
            variant: 'primary',
            icon: Box,
          },
        ];
      case 'packed':
        return [
          {
            label: t('picking.detail.markDispatched'),
            onPress: handleMarkDispatched,
            variant: 'primary',
            icon: Truck,
          },
        ];
      case 'rejected_review':
        return [
          {
            label: t('picking.detail.reopenPicking'),
            onPress: handleReopenForRevision,
            variant: 'primary',
            icon: RotateCcw,
          },
        ];
      default:
        return [];
    }
  })();

  const actionsDockHeight = estimateOrderActionsHeight(footerActions.length, insets.bottom);

  return (
    <View style={styles.screen}>
      <OrderDetailHeader
        orderNumber={order.orderNumber}
        client={order.client}
        status={order.status}
        auditResult={order.auditResult}
        isPaused={order.isPaused}
        onBack={() => router.back()}
        meta={[
          { label: t('picking.detail.definedBultos'), value: String(order.definedBultos) },
          { label: t('picking.detail.bultosClosed'), value: String(closedBultos) },
          {
            label: t('picking.detail.queuePosition'),
            value: effectiveQueuePosition != null ? String(effectiveQueuePosition) : '—',
          },
        ]}
        footer={
          order.hasExtraBultos ? (
            <View style={styles.extraFlag}>
              <AlertCircle size={14} color="#B45309" />
              <Text style={styles.extraFlagText}>{t('picking.detail.extraBultosFlag')}</Text>
            </View>
          ) : undefined
        }
      />

      <OrderDetailBodyFade style={{ flex: 1 }}>
        {order.status === 'in_progress' ? (
          <PickingProgressBar
            percentage={order.progressPercentage}
            closedBultos={closedBultos}
            definedBultos={order.definedBultos}
            label={t('picking.detail.progressLabel')}
          />
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: actionsDockHeight > 0 ? actionsDockHeight + 8 : 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {order.isPaused && order.pauseInfo ? (
            <OrderDetailAlertBanner
              title={t('picking.pause.bannerTitle')}
              body={
                order.pauseInfo.reason === 'falta_articulo'
                  ? t('picking.pause.bannerBodyMissing', {
                      skus: order.pauseInfo.missingSkus.join(', '),
                    })
                  : t('picking.pause.bannerBodyPriority')
              }
              author={order.pauseInfo.authorName}
            />
          ) : null}

          {order.status === 'rejected_review' && lastObservation ? (
            <OrderDetailAlertBanner
              title={t('picking.rejection.title')}
              body={lastObservation.text}
              author={lastObservation.auditorName}
            />
          ) : null}

          {order.status === 'to_pack' ? (
            <OrderDetailAlertBanner
              title={t('picking.check.waitingTitle')}
              body={t('picking.check.waitingBody')}
            />
          ) : null}

          <OrderDetailSection
            title={t('picking.detail.linesTitle')}
            icon={ClipboardList}
            collapsible
            defaultExpanded
            badge={String(order.lines.length)}
            marginTop={16}
          >
            <OrderDetailCard>
              {order.lines.map((line, idx) => {
                const assigned = getAssignedQtyForLine(order, line.sku);
                const pending = Math.max(0, line.requiredQty - assigned);
                // Sustitución deshabilitada temporalmente (a pedido del negocio).
                const canSubstitute = false;
                return (
                  <View
                    key={line.sku}
                    style={[styles.lineRow, idx < order.lines.length - 1 && styles.lineRowBorder]}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.lineName} numberOfLines={2}>
                        {line.name}
                      </Text>
                      <Text style={styles.lineSku}>{line.sku}</Text>
                      <Text style={styles.lineMeta}>
                        {t('picking.detail.lineMeta', {
                          required: line.requiredQty,
                          assigned,
                          pending,
                        })}
                        {line.talla ? ` · ${t('picking.detail.tallaMeta', { talla: line.talla })}` : ''}
                      </Text>
                    </View>
                    <View style={styles.lineActions}>
                      <Text style={styles.lineQty}>×{line.requiredQty}</Text>
                      {isEditable && canSubstitute ? (
                        <Pressable
                          onPress={() => {
                            const openBultoTarget = order.bultos.find((b) => b.status === 'open');
                            if (!openBultoTarget) {
                              setConfirmSheet({
                                title: t('picking.substitute.needBultoTitle'),
                                message: t('picking.substitute.needBultoBody'),
                                mode: 'info',
                                confirmLabel: t('common.understood'),
                              });
                              return;
                            }
                            setSubstituteLine(line);
                          }}
                          style={styles.substituteBtn}
                        >
                          <ArrowLeftRight size={14} color="#4338CA" />
                          <Text style={styles.substituteText}>{t('picking.substitute.btn')}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </OrderDetailCard>
          </OrderDetailSection>

          {showBultos ? (
            <OrderDetailSection title={t('picking.detail.bultosTitle')} icon={Package}>
              {order.bultos.length === 0 ? (
                <OrderDetailCard>
                  <Text style={styles.emptyBultosTitle}>{t('picking.detail.noBultos')}</Text>
                </OrderDetailCard>
              ) : (
                order.bultos.map((bulto) => (
                  <BultoCard
                    key={bulto.id}
                    bulto={bulto}
                    editable={isEditable}
                    getItemMaxQty={(itemId) => getMaxQtyForBultoItem(order, itemId)}
                    onClose={(bid) => handleCloseBulto(bid)}
                    onReopen={(bid) => reopenBulto(order.id, bid)}
                    onAddItem={handleAddItemToBulto}
                    onCapacityExceeded={() => showCapacityToast(maxReachedTooltip)}
                    onUpdateItemQty={(bid, iid, qty) => {
                      if (qty < 1) {
                        handleRemoveItem(bid, iid);
                        return;
                      }
                      const maxQty = getMaxQtyForBultoItem(order, iid);
                      if (qty > maxQty) showCapacityToast(maxReachedTooltip);
                      updateBultoItem(order.id, bid, iid, Math.min(qty, maxQty));
                    }}
                    onRemoveItem={(bid, iid) => handleRemoveItem(bid, iid)}
                  />
                ))
              )}
            </OrderDetailSection>
          ) : null}
        </ScrollView>

        <OrderDetailActions actions={footerActions} />
      </OrderDetailBodyFade>

      <AddItemSheet
        visible={addSheetBultoId !== null}
        order={order}
        bulto={order.bultos.find((b) => b.id === addSheetBultoId) ?? null}
        onClose={() => setAddSheetBultoId(null)}
        onAddItems={(items) => {
          if (!addSheetBultoId) return;
          commitAddItems(addSheetBultoId, items);
        }}
      />

      <SubstituteItemSheet
        visible={substituteLine !== null}
        order={order}
        originalLine={substituteLine}
        targetBulto={order.bultos.find((b) => b.status === 'open') ?? null}
        onClose={() => setSubstituteLine(null)}
        onConfirm={(entry) => {
          const openBultoTarget = order.bultos.find((b) => b.status === 'open');
          if (!openBultoTarget) return;
          commitAddItems(
            openBultoTarget.id,
            [{ sku: entry.sku, name: entry.name, qty: entry.qty }],
            {
              originalSku: entry.originalSku,
              substitutionNote: entry.substitutionNote,
            },
          );
        }}
      />

      <PausePickingSheet
        visible={pauseSheetVisible}
        lines={order.lines}
        onClose={() => setPauseSheetVisible(false)}
        onConfirm={handleConfirmPause}
      />

      <Toast
        message={capacityToast}
        nudgeToken={capacityToastNudge}
        topInset={insets.top + 64}
      />

      <ConfirmSheet
        visible={confirmSheet !== null}
        title={confirmSheet?.title ?? ''}
        message={confirmSheet?.message ?? ''}
        messageItems={confirmSheet?.messageItems}
        mode={confirmSheet?.mode ?? 'confirm'}
        tone={confirmSheet?.tone}
        confirmLabel={confirmSheet?.confirmLabel}
        cancelLabel={confirmSheet?.cancelLabel}
        icon={confirmSheet?.icon}
        onConfirm={confirmSheet?.onConfirm}
        onCancel={confirmSheet?.onCancel}
        dismissible={confirmSheet?.dismissible ?? true}
        onClose={() => setConfirmSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SCREEN_BG, position: 'relative' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16, paddingTop: 0 },
  extraFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  extraFlagText: { fontSize: 12, color: '#B45309', fontWeight: '600' },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  lineRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#F3F4F6',
  },
  lineName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  lineSku: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  lineMeta: { fontSize: 11, color: '#6B7280', marginTop: 4, lineHeight: 16 },
  lineActions: { alignItems: 'flex-end', gap: 6 },
  lineQty: { fontSize: 16, fontWeight: '800', color: '#111827' },
  substituteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  substituteText: { fontSize: 10, fontWeight: '700', color: '#4338CA' },
  emptyBultosTitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
});
