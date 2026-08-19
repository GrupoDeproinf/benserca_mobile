import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Box,
  ClipboardList,
  PackageOpen,
  Play,
  UserCheck,
  UserMinus,
  Users2,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import {
  estimateOrderActionsHeight,
  type OrderDetailAction,
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
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import { ConfirmSheet } from '@/shared/components/ui/confirm-sheet';
import { ExpandableText } from '@/shared/components/ui/expandable-text';
import { Text } from '@/shared/components/ui/text';
import { LeadTeamMemberCard } from '../components/lead-team-member-card';
import { useTeamsStore } from '../store/teams.store';

interface LeadOrderDetailScreenProps {
  orderId: string;
}

interface ReleasePickerTarget {
  uid: string;
  name: string;
}

const SCREEN_BG = '#F2F2F7';

export function LeadOrderDetailScreen({ orderId }: LeadOrderDetailScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();

  const order = useOrdersStore((s) => s.orders.find((o) => o.id === orderId));
  const pickers = usePickersStore((s) => s.pickers);
  const releasePicker = useTeamsStore((s) => s.releasePicker);
  const releaseTeam = useTeamsStore((s) => s.releaseTeam);
  const resumePicking = useOrdersStore((s) => s.resumePicking);
  const markWrapped = useOrdersStore((s) => s.markWrapped);
  const assignSelfAsPicker = useOrdersStore((s) => s.assignSelfAsPicker);
  const startPicking = useOrdersStore((s) => s.startPicking);

  const [confirmReleaseTeam, setConfirmReleaseTeam] = useState(false);
  const [confirmWrap, setConfirmWrap] = useState(false);
  const [howToWorkVisible, setHowToWorkVisible] = useState(false);
  const [releasePickerTarget, setReleasePickerTarget] = useState<ReleasePickerTarget | null>(null);

  const teamMembers = useMemo(() => {
    if (!order) return [];
    return order.teamPickerUids.map((uid) => pickers.find((p) => p.uid === uid)).filter(Boolean);
  }, [order, pickers]);

  if (!order || !user) {
    return (
      <View style={[styles.centered, { backgroundColor: SCREEN_BG }]}>
        <Text>{t('teams.manage.notFound')}</Text>
      </View>
    );
  }

  const hasActiveTeam = order.teamPickerUids.length > 0;

  const handleStartPicking = () => {
    Haptics.selectionAsync();
    setHowToWorkVisible(true);
  };

  const handleBuildTeam = () => {
    setHowToWorkVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(app)/lead/team/assign/${order.id}` as never);
  };

  /**
   * El jefe trabaja el pedido él solo: primero se pone como picker asignado y
   * después arranca el picking, para que el pedido quede a su nombre en la cola
   * y en el tablero. No tiene el límite de un pedido activo a la vez.
   */
  const handleWorkAlone = () => {
    setHowToWorkVisible(false);
    assignSelfAsPicker(order.id);
    const result = startPicking(order.id, user.uid);
    if (!result.ok) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(app)/lead/order/${order.id}` as never);
  };

  const handleConfirmReleasePicker = () => {
    if (!releasePickerTarget) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    releasePicker(order.id, releasePickerTarget.uid);
    setReleasePickerTarget(null);
  };

  const handleConfirmReleaseTeam = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    releaseTeam(order.id);
    setConfirmReleaseTeam(false);
  };

  const handleResumePicking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resumePicking(order.id);
  };

  const handleConfirmWrap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    markWrapped(order.id);
    setConfirmWrap(false);
  };

  /** El jefe está trabajando este pedido él mismo (sin equipo). */
  const isWorkingItAlone =
    order.assignedPickerId === user.uid &&
    (order.status === 'in_progress' || order.status === 'rejected_review');

  const footerActions: OrderDetailAction[] = order.isPaused
    ? [
        {
          label: t('picking.detail.resumePicking'),
          onPress: handleResumePicking,
          variant: 'primary',
          icon: Play,
        },
      ]
    : isWorkingItAlone
      ? [
          {
            label: t('teams.workAlone.continue'),
            onPress: () => router.push(`/(app)/lead/order/${order.id}` as never),
            variant: 'primary',
            icon: PackageOpen,
          },
        ]
      : order.status === 'assigned' && !hasActiveTeam
        ? [
            {
              label: t('picking.detail.startPicking'),
              onPress: handleStartPicking,
              variant: 'primary',
              icon: Play,
            },
          ]
        : order.status === 'audited'
          ? [
              // Embalar cierra el recorrido del jefe: el pedido cambia de
              // estatus y sale de su lista. Despachar ya no es cosa suya.
              {
                label: t('picking.detail.markWrapped'),
                onPress: () => setConfirmWrap(true),
                variant: 'primary',
                icon: Box,
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
        onBack={() => router.back()}
        meta={[
          { label: t('picking.detail.definedBultos'), value: String(order.definedBultos) },
          { label: t('picking.detail.skus'), value: String(order.lines.length) },
          {
            label: t('teams.manage.teamStatus'),
            value: hasActiveTeam ? t('teams.manage.teamActive') : t('teams.manage.teamNone'),
          },
        ]}
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

        <OrderDetailSection title={t('picking.detail.linesTitle')} icon={ClipboardList}>
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
                <Text style={styles.lineQty}>×{line.requiredQty}</Text>
              </View>
            ))}
          </OrderDetailCard>
        </OrderDetailSection>

        {hasActiveTeam ? (
          <OrderDetailSection
            title={t('teams.manage.membersTitle', { count: teamMembers.length })}
            icon={UserCheck}
          >
            {teamMembers.length === 0 ? (
              <OrderDetailCard>
                <Text style={styles.emptyText}>{t('teams.manage.noMembers')}</Text>
              </OrderDetailCard>
            ) : (
              teamMembers.map(
                (p) =>
                  p && (
                    <LeadTeamMemberCard
                      key={p.uid}
                      picker={p}
                      onRelease={() => setReleasePickerTarget({ uid: p.uid, name: p.nombre })}
                    />
                  ),
              )
            )}

            <Pressable onPress={() => setConfirmReleaseTeam(true)} style={styles.releaseTeamWrap}>
              <Text style={styles.releaseTeamBtn}>{t('teams.releaseTeam.btn')}</Text>
            </Pressable>
          </OrderDetailSection>
        ) : null}
      </ScrollView>

      <OrderDetailActions actions={footerActions} />

      <ConfirmSheet
        visible={releasePickerTarget !== null}
        title={t('teams.releasePicker.title')}
        message={
          releasePickerTarget
            ? t('teams.releasePicker.body', { name: releasePickerTarget.name })
            : ''
        }
        mode="confirm"
        tone="warning"
        icon={UserMinus}
        confirmLabel={t('teams.releasePicker.confirm')}
        onConfirm={handleConfirmReleasePicker}
        onClose={() => setReleasePickerTarget(null)}
      />

      <ConfirmSheet
        visible={howToWorkVisible}
        title={t('teams.workAlone.title')}
        message={t('teams.workAlone.body')}
        mode="confirm"
        icon={Users2}
        confirmLabel={t('teams.workAlone.alone')}
        cancelLabel={t('teams.workAlone.team')}
        onConfirm={handleWorkAlone}
        onCancel={handleBuildTeam}
        onClose={() => setHowToWorkVisible(false)}
      />

      <ConfirmSheet
        visible={confirmReleaseTeam}
        title={t('teams.releaseTeam.title')}
        message={t('teams.releaseTeam.body')}
        mode="confirm"
        tone="warning"
        icon={Users2}
        confirmLabel={t('teams.releaseTeam.confirm')}
        onConfirm={handleConfirmReleaseTeam}
        onClose={() => setConfirmReleaseTeam(false)}
      />

      <ConfirmSheet
        visible={confirmWrap}
        title={t('picking.wrap.confirmTitle')}
        message={t('picking.wrap.confirmBody')}
        mode="confirm"
        confirmLabel={t('picking.wrap.confirm')}
        icon={Box}
        onConfirm={handleConfirmWrap}
        onClose={() => setConfirmWrap(false)}
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
  emptyText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 16,
  },
  releaseTeamWrap: {
    marginTop: 4,
    alignItems: 'center',
  },
  releaseTeamBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    paddingVertical: 12,
  },
});
