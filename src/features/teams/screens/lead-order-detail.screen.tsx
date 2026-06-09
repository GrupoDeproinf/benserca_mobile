import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ClipboardList, Play, UserCheck, UserMinus, Users2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import {
  estimateOrderActionsHeight,
  OrderDetailActions,
  type OrderDetailAction,
} from '@/features/picking/components/order-detail-action-bar';
import { OrderDetailHeader } from '@/features/picking/components/order-detail-header';
import { OrderDetailCard, OrderDetailSection } from '@/features/picking/components/order-detail-section';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import { ConfirmSheet } from '@/shared/components/ui/confirm-sheet';
import { Text } from '@/shared/components/ui/text';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
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
  const activeTeam = useTeamsStore((s) =>
    s.teams.find((team) => team.orderId === orderId && team.status === 'active'),
  );

  const [confirmReleaseTeam, setConfirmReleaseTeam] = useState(false);
  const [releasePickerTarget, setReleasePickerTarget] = useState<ReleasePickerTarget | null>(null);

  const teamMembers = useMemo(() => {
    if (!activeTeam) return [];
    return activeTeam.pickerIds
      .map((uid) => pickers.find((p) => p.uid === uid))
      .filter(Boolean);
  }, [activeTeam, pickers]);

  if (!order || !user) {
    return (
      <View style={[styles.centered, { backgroundColor: SCREEN_BG }]}>
        <Text>{t('teams.manage.notFound')}</Text>
      </View>
    );
  }

  const hasActiveTeam = !!activeTeam;

  const handleStartPicking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(app)/lead/team/assign/${order.id}` as never);
  };

  const handleConfirmReleasePicker = () => {
    if (!activeTeam || !releasePickerTarget) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    releasePicker(activeTeam.id, releasePickerTarget.uid);
    setReleasePickerTarget(null);
  };

  const handleConfirmReleaseTeam = () => {
    if (!activeTeam) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    releaseTeam(activeTeam.id);
    setConfirmReleaseTeam(false);
  };

  const footerActions: OrderDetailAction[] =
    order.status === 'assigned' && !hasActiveTeam
      ? [
          {
            label: t('picking.detail.startPicking'),
            onPress: handleStartPicking,
            variant: 'primary',
            icon: Play,
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
                      onRelease={() =>
                        setReleasePickerTarget({ uid: p.uid, name: p.nombre })
                      }
                    />
                  ),
              )
            )}

            <Pressable
              onPress={() => setConfirmReleaseTeam(true)}
              style={styles.releaseTeamWrap}
            >
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
