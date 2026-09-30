import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ClipboardList,
  Eye,
  type LucideIcon,
  PackageOpen,
  PauseCircle,
  Truck,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  estimateOrderActionsHeight,
  OrderDetailActions,
} from '@/features/picking/components/order-detail-action-bar';
import {
  OrderDetailAlertBanner,
  OrderDetailHeader,
} from '@/features/picking/components/order-detail-header';
import {
  OrderDetailCard,
  OrderDetailSection,
} from '@/features/picking/components/order-detail-section';
import { SkuPreviewSheet } from '@/features/picking/components/sku-preview-sheet';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { OrderLine } from '@/features/picking/types';
import { pauseBannerBodyKey } from '@/features/picking/utils/order-status';
import { ConfirmSheet, type ConfirmSheetTone } from '@/shared/components/ui/confirm-sheet';
import { ExpandableText } from '@/shared/components/ui/expandable-text';
import { Text } from '@/shared/components/ui/text';
import { LoadingBultoCard } from '../components/loading-bulto-card';
import { getLoadingProgress } from '../utils/loading-progress';

interface LoadingDetailScreenProps {
  orderId: string;
}

const SCREEN_BG = '#F2F2F7';

/** A partir de estos renglones el detalle del pedido arranca plegado. */
const MANY_LINES = 25;

/** Padding horizontal del scroll y separación entre tarjetas de la cuadrícula. */
const SCREEN_PADDING = 16;
const GRID_GAP = 12;

/**
 * Columnas de bultos según el ancho real, que cambia al girar la tablet: una
 * sola en teléfono, dos en tablet vertical y tres en horizontal. Con una
 * columna a lo ancho de una tablet cada bulto ocupaba media pantalla y un
 * pedido de 17 bultos obligaba a recorrerlo a puro scroll.
 */
function bultoColumnsFor(width: number): number {
  if (width >= 1100) return 3;
  if (width >= 700) return 2;
  return 1;
}

type ConfirmState = {
  title: string;
  message: string;
  mode: 'confirm' | 'info';
  tone?: ConfirmSheetTone;
  confirmLabel?: string;
  onConfirm?: () => void;
  icon?: LucideIcon;
};

/**
 * Carga del camión (rol `pedido_cargador`): el cargador marca cada bulto del
 * pedido embalado a medida que lo sube, y con todos arriba lo despacha.
 *
 * El pedido llega del listener de sesión (todos los Embalados, en tiempo real),
 * así que si otro cargador marca bultos del mismo pedido se ven aquí al
 * instante. Si el pedido deja de estar Embalado (se despachó o la web lo movió)
 * sale de esa lista y la pantalla muestra "no encontrado".
 */
export function LoadingDetailScreen({ orderId }: LoadingDetailScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const order = useOrdersStore((s) => s.orders.find((o) => o.id === orderId));
  const setBundleLoaded = useOrdersStore((s) => s.setBundleLoaded);
  const markDispatched = useOrdersStore((s) => s.markDispatched);

  const [confirmSheet, setConfirmSheet] = useState<ConfirmState | null>(null);
  const [previewLine, setPreviewLine] = useState<OrderLine | null>(null);

  const { width } = useWindowDimensions();
  const columns = bultoColumnsFor(width);
  const cardWidth = Math.floor((width - SCREEN_PADDING * 2 - GRID_GAP * (columns - 1)) / columns);

  // Antes del `return` temprano y sin depender de `order` (ver el mismo
  // patrón en picking-detail): así cada tarjeta de bulto conserva sus props y
  // al marcar uno solo se redibuja ese.
  const handleToggleBulto = (bundleNumber: number, loaded: boolean) => {
    setBundleLoaded(orderId, bundleNumber, loaded);
  };

  const handlePreviewItem = (lineId: string) => {
    const line = useOrdersStore
      .getState()
      .getOrderById(orderId)
      ?.lines.find((l) => l.id === lineId);
    if (line) setPreviewLine(line);
  };

  if (!order) {
    return (
      <View style={[styles.centered, { backgroundColor: SCREEN_BG }]}>
        <Text>{t('loading.detail.notFound')}</Text>
      </View>
    );
  }

  const progress = getLoadingProgress(order);
  const editable = order.status === 'packed' && !order.isPaused;
  const loadedSet = new Set(order.loadedBundles);
  const bultos = [...order.bultos].sort((a, b) => a.number - b.number);

  const handleDispatch = () => {
    if (order.isPaused) {
      setConfirmSheet({
        title: t('loading.detail.pausedTitle'),
        message: t('loading.detail.pausedBody'),
        mode: 'info',
        tone: 'warning',
        icon: PauseCircle,
      });
      return;
    }

    if (progress.total === 0) {
      setConfirmSheet({
        title: t('loading.detail.noBultosTitle'),
        message: t('loading.detail.noBultosBody'),
        mode: 'info',
        tone: 'warning',
        icon: PackageOpen,
      });
      return;
    }

    if (!progress.complete) {
      setConfirmSheet({
        title: t('loading.detail.pendingTitle'),
        message: t('loading.detail.pendingBody', {
          bultos: progress.pendingNumbers.join(', '),
        }),
        mode: 'info',
        tone: 'warning',
        icon: AlertCircle,
      });
      return;
    }

    setConfirmSheet({
      title: t('loading.detail.dispatchConfirmTitle'),
      message: t('loading.detail.dispatchConfirmBody', { count: progress.total }),
      mode: 'confirm',
      confirmLabel: t('loading.detail.dispatchConfirm'),
      icon: Truck,
      onConfirm: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        markDispatched(order.id);
        router.back();
      },
    });
  };

  const footerActions =
    order.status === 'packed'
      ? [
          {
            label: t('loading.detail.dispatch'),
            onPress: handleDispatch,
            variant: 'primary' as const,
            icon: Truck,
          },
        ]
      : [];
  const actionsDockHeight = estimateOrderActionsHeight(footerActions.length, insets.bottom);

  return (
    <View style={styles.screen}>
      <OrderDetailHeader
        orderNumber={order.orderNumber}
        client={order.client}
        status={order.status}
        auditResult={order.auditResult}
        isPaused={order.isPaused}
        isPromo={order.duplicateSkusPromo}
        onBack={() => router.back()}
        meta={[
          { label: t('loading.detail.bultos'), value: String(progress.total) },
          {
            label: t('loading.detail.loaded'),
            value: `${progress.loaded}/${progress.total}`,
          },
        ]}
        progress={progress.total > 0 ? progress.loaded / progress.total : 0}
        progressLabel={t('loading.detail.progress')}
      />

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
            body={t(pauseBannerBodyKey(order.pauseInfo.reason), {
              skus: order.pauseInfo.missingSkus.join(', '),
            })}
            author={order.pauseInfo.authorName}
          />
        ) : null}

        <OrderDetailSection
          title={t('loading.detail.bultosTitle')}
          icon={Truck}
          badge={`${progress.loaded}/${progress.total}`}
          badgeTone={progress.complete ? 'success' : 'default'}
          marginTop={16}
        >
          {bultos.length === 0 ? (
            <OrderDetailCard>
              <Text style={styles.emptyText}>{t('loading.detail.noBultos')}</Text>
            </OrderDetailCard>
          ) : (
            <View style={styles.grid}>
              {bultos.map((bulto) => (
                <LoadingBultoCard
                  key={bulto.id}
                  bulto={bulto}
                  loaded={loadedSet.has(bulto.number)}
                  editable={editable}
                  onToggle={handleToggleBulto}
                  onPreviewItem={handlePreviewItem}
                  style={{ width: cardWidth }}
                />
              ))}
            </View>
          )}
        </OrderDetailSection>

        <OrderDetailSection
          title={t('loading.detail.linesTitle')}
          icon={ClipboardList}
          collapsible
          defaultExpanded={order.lines.length <= MANY_LINES}
          badge={String(order.lines.length)}
        >
          <OrderDetailCard>
            {order.lines.map((line, idx) => (
              <View
                key={line.id}
                style={[styles.lineRow, idx < order.lines.length - 1 && styles.lineRowBorder]}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <ExpandableText style={styles.lineName} numberOfLines={2}>
                    {line.name}
                  </ExpandableText>
                  <Text style={styles.lineSku}>{line.sku}</Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPreviewLine(line);
                  }}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t('picking.skuPreview.open')}
                  style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                >
                  <View style={styles.eyeBtn} collapsable={false}>
                    <Eye size={18} color="#8E8E93" strokeWidth={2.2} />
                  </View>
                </Pressable>
                <Text style={styles.lineQty}>×{line.requiredQty}</Text>
              </View>
            ))}
          </OrderDetailCard>
        </OrderDetailSection>
      </ScrollView>

      <OrderDetailActions actions={footerActions} />

      <SkuPreviewSheet line={previewLine} onClose={() => setPreviewLine(null)} />

      <ConfirmSheet
        visible={confirmSheet !== null}
        title={confirmSheet?.title ?? ''}
        message={confirmSheet?.message ?? ''}
        mode={confirmSheet?.mode ?? 'confirm'}
        tone={confirmSheet?.tone}
        confirmLabel={confirmSheet?.confirmLabel ?? t('common.understood')}
        icon={confirmSheet?.icon}
        onConfirm={confirmSheet?.onConfirm}
        onClose={() => setConfirmSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SCREEN_BG },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: SCREEN_PADDING, paddingTop: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  emptyText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 16,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lineRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#F3F4F6',
  },
  lineName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  lineSku: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  eyeBtn: { padding: 2, marginRight: 10 },
  lineQty: { fontSize: 16, fontWeight: '800', color: '#111827', minWidth: 40, textAlign: 'right' },
});
