import { AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OrderStatus } from '../types';
import {
  ORDER_STATUS_I18N_KEY,
  PAUSED_BADGE_STYLE,
  PAUSED_STATUS_I18N_KEY,
} from '../utils/order-status';
import { OrderDetailTransitionProgressContext } from './order-detail-transition';

const SCREEN_BG = '#F2F2F7';
const ENTER_MS = 300;

/** Igual que `AppHeroTopBar`: insets.top + 2 + logo 72 + paddingBottom 8 */
const LOGO_BAND_BODY = 80;
const DETAIL_BAND_BODY = 124;

const STATUS_STYLE: Partial<Record<OrderStatus, { bg: string; text: string }>> = {
  assigned: { bg: '#FEF3C7', text: '#B45309' },
  in_progress: { bg: '#D1FAE5', text: '#059669' },
  to_pack: { bg: '#E0E7FF', text: '#4338CA' },
  packed: { bg: '#DCFCE7', text: '#15803D' },
  rejected_review: { bg: '#FEE2E2', text: '#B91C1C' },
  audited: { bg: '#D1FAE5', text: '#047857' },
  dispatched: { bg: '#DBEAFE', text: '#1D4ED8' },
};

const bannerStyles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  body: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 19,
  },
  author: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: SCREEN_BG,
    paddingBottom: 4,
  },
  blackBand: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  backBtn: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  orderNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  client: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  metaChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  metaChipBorder: {
    borderRightWidth: StyleSheet.hairlineWidth * 2,
    borderRightColor: '#E5E5EA',
  },
  metaLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
    textAlign: 'center',
  },
  footer: {
    marginTop: 12,
  },
});

interface OrderDetailMetaCardProps {
  meta: { label: string; value: string }[];
  footer?: React.ReactNode;
  style?: ViewStyle;
}

export function OrderDetailMetaCard({ meta, footer, style }: OrderDetailMetaCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.metaRow}>
        {meta.map((item, idx) => (
          <View
            key={item.label}
            style={[styles.metaChip, idx < meta.length - 1 && styles.metaChipBorder]}
          >
            <Text style={styles.metaLabel}>{item.label}</Text>
            <Text style={styles.metaValue} numberOfLines={2}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

interface OrderDetailHeaderProps {
  orderNumber: string;
  client: string;
  status: OrderStatus;
  /** Resultado de auditoría (`order.auditResult`); afecta la etiqueta cuando status es "audited". */
  auditResult?: 'approved' | 'rejected' | null;
  /** Si el pedido está pausado, el badge "En pausa" reemplaza al del estatus. */
  isPaused?: boolean;
  meta: { label: string; value: string }[];
  onBack: () => void;
  footer?: React.ReactNode;
  animateEnter?: boolean;
  /** Meta card dentro del scroll (no fija bajo la franja negra). */
  metaInScroll?: boolean;
}

/** Expande la franja negra al entrar; al volver el stack hace slide nativo. */
export function OrderDetailHeader({
  orderNumber,
  client,
  status,
  auditResult,
  isPaused = false,
  meta,
  onBack,
  footer,
  animateEnter = true,
  metaInScroll = false,
}: OrderDetailHeaderProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const badgeStyle = isPaused ? PAUSED_BADGE_STYLE : STATUS_STYLE[status];
  // "audited" solo cubre el resultado aprobado por diseño (un rechazo pasa a
  // "rejected_review"), pero se apoya en audit.result como fuente de verdad.
  const statusLabel = isPaused
    ? t(PAUSED_STATUS_I18N_KEY)
    : status === 'audited' && auditResult === 'rejected'
      ? t(ORDER_STATUS_I18N_KEY.rejected_review)
      : status === 'audited'
        ? t('orderStatus.approved')
        : t(ORDER_STATUS_I18N_KEY[status]);
  const progress = useSharedValue(animateEnter ? 0 : 1);

  const bandTop = insets.top + 2;
  const compactHeight = bandTop + LOGO_BAND_BODY;
  const expandedHeight = bandTop + DETAIL_BAND_BODY;

  useEffect(() => {
    if (!animateEnter) return;

    requestAnimationFrame(() => {
      progress.value = withTiming(1, {
        duration: ENTER_MS,
        easing: Easing.out(Easing.cubic),
      });
    });
  }, [animateEnter, progress]);

  const blackBandStyle = useAnimatedStyle(() => ({
    height: interpolate(
      progress.value,
      [0, 1],
      [compactHeight, expandedHeight],
      Extrapolation.CLAMP,
    ),
    paddingBottom: interpolate(progress.value, [0, 1], [8, 18], Extrapolation.CLAMP),
  }));

  const orderContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.28, 0.72], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(progress.value, [0.28, 0.72], [6, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const metaCardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.48, 0.92], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(progress.value, [0.48, 0.92], [8, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const backBtnStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.22, 0.48], [0, 1], Extrapolation.CLAMP),
    height: interpolate(progress.value, [0, 0.28], [0, 36], Extrapolation.CLAMP),
    marginBottom: interpolate(progress.value, [0, 0.28], [0, 2], Extrapolation.CLAMP),
    overflow: 'hidden' as const,
  }));

  return (
    <OrderDetailTransitionProgressContext.Provider value={progress}>
      <View style={styles.wrap}>
        <Animated.View style={[styles.blackBand, { paddingTop: bandTop }, blackBandStyle]}>
          <Animated.View style={backBtnStyle}>
            <Pressable
              onPress={onBack}
              hitSlop={12}
              style={styles.backBtn}
              accessibilityLabel={t('common.back')}
            >
              <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>
          </Animated.View>

          <Animated.View style={orderContentStyle}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.orderNumber}>{orderNumber}</Text>
                <Text style={styles.client} numberOfLines={2}>
                  {client}
                </Text>
              </View>
              {badgeStyle ? (
                <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                  <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{statusLabel}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        </Animated.View>

        {!metaInScroll ? (
          <Animated.View style={metaCardStyle}>
            <OrderDetailMetaCard meta={meta} footer={footer} />
          </Animated.View>
        ) : null}
      </View>
    </OrderDetailTransitionProgressContext.Provider>
  );
}

export function OrderDetailAlertBanner({
  title,
  body,
  author,
}: {
  title: string;
  body: string;
  author?: string;
}) {
  return (
    <View style={bannerStyles.wrap}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <AlertCircle size={16} color="#B91C1C" />
        <Text style={bannerStyles.title}>{title}</Text>
      </View>
      <Text style={bannerStyles.body}>{body}</Text>
      {author ? <Text style={bannerStyles.author}>— {author}</Text> : null}
    </View>
  );
}

export const ORDER_DETAIL_HEADER_ENTER_MS = ENTER_MS;
