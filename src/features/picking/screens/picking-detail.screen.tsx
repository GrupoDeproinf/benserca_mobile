import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Box,
  ClipboardList,
  Package,
  PackageOpen,
  PackagePlus,
  Play,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { ConfirmSheet, type ConfirmSheetTone } from '@/shared/components/ui/confirm-sheet';
import { Text } from '@/shared/components/ui/text';
import { AddItemSheet } from '../components/add-item-sheet';
import { BultoCard } from '../components/bulto-card';
import {
  estimateOrderActionsHeight,
  OrderDetailActions,
  type OrderDetailAction,
} from '../components/order-detail-action-bar';
import { OrderActionButton } from '../components/order-action-button';
import { OrderDetailAlertBanner, OrderDetailHeader } from '../components/order-detail-header';
import { OrderDetailBodyFade } from '../components/order-detail-transition';
import { OrderDetailCard, OrderDetailSection } from '../components/order-detail-section';
import { useOrdersStore } from '../store/orders.store';

interface PickingDetailScreenProps {
  orderId: string;
}

const SCREEN_BG = '#F2F2F7';

type ConfirmState = {
  title: string;
  message: string;
  mode: 'confirm' | 'info';
  tone?: ConfirmSheetTone;
  confirmLabel?: string;
  onConfirm?: () => void;
  icon?: LucideIcon;
};

export function PickingDetailScreen({ orderId }: PickingDetailScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();

  const order = useOrdersStore((s) => s.getOrderById(orderId));
  const startPicking = useOrdersStore((s) => s.startPicking);
  const finishPicking = useOrdersStore((s) => s.finishPicking);
  const markPacked = useOrdersStore((s) => s.markPacked);
  const reopenForRevision = useOrdersStore((s) => s.reopenForRevision);
  const openBulto = useOrdersStore((s) => s.openBulto);
  const closeBulto = useOrdersStore((s) => s.closeBulto);
  const reopenBulto = useOrdersStore((s) => s.reopenBulto);
  const addBultoItem = useOrdersStore((s) => s.addBultoItem);
  const removeBultoItem = useOrdersStore((s) => s.removeBultoItem);
  const updateBultoItem = useOrdersStore((s) => s.updateBultoItem);

  const [addSheetBultoId, setAddSheetBultoId] = useState<string | null>(null);
  const [confirmSheet, setConfirmSheet] = useState<ConfirmState | null>(null);

  if (!order) {
    return (
      <View style={[styles.centered, { backgroundColor: SCREEN_BG }]}>
        <Text>{t('picking.detail.notFound')}</Text>
      </View>
    );
  }

  if (!user) return null;

  const isEditable = order.status === 'in_progress' || order.status === 'rejected_review';
  const showBultos =
    order.status === 'in_progress' ||
    order.status === 'to_pack' ||
    order.status === 'rejected_review' ||
    order.status === 'packed' ||
    order.status === 'audited';

  const lastObservation = order.auditObservations[order.auditObservations.length - 1];

  const performOpenBulto = () => {
    const result = openBulto(order.id);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startPicking(order.id, user.uid);
  };

  const handleFinishPicking = () => {
    const hasOpenBultos = order.bultos.some((b) => b.status === 'open');
    if (hasOpenBultos) {
      setConfirmSheet({
        title: t('picking.finish.openBultosTitle'),
        message: t('picking.finish.openBultosBody'),
        mode: 'info',
        tone: 'warning',
        confirmLabel: t('common.understood'),
        icon: PackageOpen,
      });
      return;
    }
    setConfirmSheet({
      title: t('picking.finish.confirmTitle'),
      message: t('picking.finish.confirmBody'),
      mode: 'confirm',
      confirmLabel: t('picking.finish.confirm'),
      icon: PackageOpen,
      onConfirm: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        finishPicking(order.id, user.uid);
      },
    });
  };

  const handleMarkPacked = () => {
    setConfirmSheet({
      title: t('picking.pack.confirmTitle'),
      message: t('picking.pack.confirmBody'),
      mode: 'confirm',
      confirmLabel: t('picking.pack.confirm'),
      icon: Box,
      onConfirm: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        markPacked(order.id);
      },
    });
  };

  const handleReopenForRevision = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reopenForRevision(order.id, user.uid);
  };

  const footerActions: OrderDetailAction[] = (() => {
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
          {
            label: t('picking.detail.finishPicking'),
            onPress: handleFinishPicking,
            variant: 'primary',
            icon: PackageOpen,
          },
        ];
      case 'to_pack':
        return [
          {
            label: t('picking.detail.markPacked'),
            onPress: handleMarkPacked,
            variant: 'primary',
            icon: Box,
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
        onBack={() => router.back()}
        meta={[
          { label: t('picking.detail.definedBultos'), value: String(order.definedBultos) },
          { label: t('picking.detail.bultosDone'), value: String(order.bultos.length) },
          { label: t('picking.detail.skus'), value: String(order.lines.length) },
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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: actionsDockHeight > 0 ? actionsDockHeight + 8 : 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
        {order.status === 'rejected_review' && lastObservation ? (
          <OrderDetailAlertBanner
            title={t('picking.rejection.title')}
            body={lastObservation.text}
            author={lastObservation.auditorName}
          />
        ) : null}

        <OrderDetailSection title={t('picking.detail.linesTitle')} icon={ClipboardList}>
          <OrderDetailCard>
            {order.lines.map((line, idx) => (
              <View
                key={line.sku}
                style={[styles.lineRow, idx < order.lines.length - 1 && styles.lineRowBorder]}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.lineName} numberOfLines={2}>
                    {line.name}
                  </Text>
                  <Text style={styles.lineSku}>{line.sku}</Text>
                </View>
                <Text style={styles.lineQty}>×{line.requiredQty}</Text>
              </View>
            ))}
          </OrderDetailCard>
        </OrderDetailSection>

        {showBultos ? (
          <OrderDetailSection title={t('picking.detail.bultosTitle')} icon={Package}>
            {order.bultos.length === 0 ? (
              <OrderDetailCard>
                <Text style={styles.emptyBultosTitle}>{t('picking.bulto.empty')}</Text>
                {order.status === 'in_progress' ? (
                  <View style={styles.emptyBultosCta}>
                    <OrderActionButton
                      label={t('picking.detail.openBulto')}
                      onPress={handleOpenBulto}
                      variant="secondary"
                      icon={PackagePlus}
                    />
                  </View>
                ) : null}
              </OrderDetailCard>
            ) : (
              order.bultos.map((bulto) => (
                <BultoCard
                  key={bulto.id}
                  bulto={bulto}
                  editable={isEditable}
                  onClose={(bid) => closeBulto(order.id, bid)}
                  onReopen={(bid) => reopenBulto(order.id, bid)}
                  onAddItem={(bid) => setAddSheetBultoId(bid)}
                  onUpdateItemQty={(bid, iid, qty) => updateBultoItem(order.id, bid, iid, qty)}
                  onRemoveItem={(bid, iid) => removeBultoItem(order.id, bid, iid)}
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
        onClose={() => setAddSheetBultoId(null)}
        onAddItems={(items) => {
          if (!addSheetBultoId) return;
          items.forEach(({ sku, name, qty }) => {
            addBultoItem(order.id, addSheetBultoId, sku, name, qty);
          });
          setAddSheetBultoId(null);
        }}
      />

      <ConfirmSheet
        visible={confirmSheet !== null}
        title={confirmSheet?.title ?? ''}
        message={confirmSheet?.message ?? ''}
        mode={confirmSheet?.mode ?? 'confirm'}
        tone={confirmSheet?.tone}
        confirmLabel={confirmSheet?.confirmLabel}
        icon={confirmSheet?.icon}
        onConfirm={confirmSheet?.onConfirm}
        onClose={() => setConfirmSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
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
  extraFlagText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  lineRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#F3F4F6',
  },
  lineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  lineSku: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  lineQty: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  emptyBultosTitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  emptyBultosCta: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
