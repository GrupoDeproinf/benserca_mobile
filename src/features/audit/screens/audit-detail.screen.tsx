import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Eye,
  GitCompare,
  MessageSquareWarning,
  Package,
  Play,
  XCircle,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { OrderActionButton } from '@/features/picking/components/order-action-button';
import { estimateOrderActionsHeight } from '@/features/picking/components/order-detail-action-bar';
import {
  OrderDetailAlertBanner,
  OrderDetailHeader,
  OrderDetailMetaCard,
} from '@/features/picking/components/order-detail-header';
import {
  OrderDetailCard,
  OrderDetailSection,
} from '@/features/picking/components/order-detail-section';
import { OrderDetailBodyFade } from '@/features/picking/components/order-detail-transition';
import { SkuPreviewSheet } from '@/features/picking/components/sku-preview-sheet';
import { useFirestoreOrder } from '@/features/picking/hooks/use-firestore-order';
import { useOrdersStore } from '@/features/picking/store/orders.store';
import type { Bulto, OrderLine } from '@/features/picking/types';
import {
  pauseBannerBodyKey,
  wasCorrectedAfterRejection,
} from '@/features/picking/utils/order-status';
import { usePickersStore } from '@/features/warehouse/store/pickers.store';
import { resolvePickerName } from '@/features/warehouse/utils/resolve-picker-name';
import { ConfirmSheet } from '@/shared/components/ui/confirm-sheet';
import { ExpandableText } from '@/shared/components/ui/expandable-text';
import { Text } from '@/shared/components/ui/text';
import { AuditBultoAccordion, type BultoAuditStatus } from '../components/audit-bulto-accordion';
import { AuditBultoGroup } from '../components/audit-bulto-group';
import { AuditComparisonCard } from '../components/audit-comparison-card';
import { RejectObservationSheet } from '../components/reject-observation-sheet';
import { buildAuditComparison, hasComparisonIssues } from '../utils/audit-comparison';
import { buildAuditBultoEntries } from '../utils/bulto-groups';

interface AuditDetailScreenProps {
  orderId: string;
}

const SCREEN_BG = '#F2F2F7';
const NO_LINES: OrderLine[] = [];
const NO_BULTOS: Bulto[] = [];

function formatPackedAt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditDetailScreen({ orderId }: AuditDetailScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();

  const { order, loading } = useFirestoreOrder(orderId || null);
  const pickers = usePickersStore((s) => s.pickers);
  const approveAudit = useOrdersStore((s) => s.approveAudit);
  const rejectAudit = useOrdersStore((s) => s.rejectAudit);
  const resumePicking = useOrdersStore((s) => s.resumePicking);

  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejectSheetVisible, setRejectSheetVisible] = useState(false);
  const [bultoReviews, setBultoReviews] = useState<Record<string, BultoAuditStatus>>({});
  /** Bultos de un solo artículo tildados para aprobar/rechazar en bloque. */
  const [selectedBultoIds, setSelectedBultoIds] = useState<ReadonlySet<string>>(() => new Set());
  /** Bulto mixto → ítems que el chequeador marcó como correctos. */
  const [checkedItems, setCheckedItems] = useState<Record<string, string[]>>({});
  const [previewLine, setPreviewLine] = useState<OrderLine | null>(null);

  const pickerName = useMemo(
    () => resolvePickerName(pickers, order?.assignedPickerId),
    [order?.assignedPickerId, pickers],
  );

  const originalLines = order?.snapshotOriginal ?? order?.lines ?? NO_LINES;
  const bultos = order?.bultos ?? NO_BULTOS;
  // Las dependencias deben ser exactamente lo que lee el memo: con
  // `order?.x` en la lista y `order.x` en el cuerpo, React Compiler no podía
  // preservarlo y dejaba TODA la pantalla sin optimizar.
  const snapshotOriginal = order?.snapshotOriginal;
  const comparisonRows = useMemo(() => {
    if (!snapshotOriginal?.length) return [];
    return buildAuditComparison(snapshotOriginal, bultos);
  }, [snapshotOriginal, bultos]);

  /** Renglones armados sin equivalente en el pedido no tienen foto que mostrar. */
  const handlePreviewLineId = useCallback(
    (lineId: string) => {
      const line = originalLines.find((l) => l.id === lineId);
      if (line) setPreviewLine(line);
    },
    [originalLines],
  );

  const bultoEntries = useMemo(() => buildAuditBultoEntries(bultos), [bultos]);
  const mixedBultoIds = useMemo(
    () =>
      new Set(
        bultoEntries.flatMap((entry) =>
          entry.kind === 'bulto' && entry.mixed ? [entry.bulto.id] : [],
        ),
      ),
    [bultoEntries],
  );

  const allReviewed = order ? order.bultos.every((b) => bultoReviews[b.id]) : false;
  const allApproved = order ? order.bultos.every((b) => bultoReviews[b.id] === 'approved') : false;

  const rejectPrefill = useMemo(() => {
    if (!order) return '';
    const rejected = order.bultos.filter((b) => bultoReviews[b.id] === 'rejected');
    if (rejected.length === 0) return '';
    return rejected
      .map((b) => {
        // En un mixto, lo que el chequeador no tildó es lo que está mal.
        const checked = checkedItems[b.id] ?? [];
        const wrong = mixedBultoIds.has(b.id)
          ? b.items.filter((item) => !checked.includes(item.id))
          : [];
        if (wrong.length === 0) return t('audit.reject.bultoLine', { number: b.number });
        const items = wrong.map((item) => `${item.name} (${item.sku}) ×${item.qty}`).join('; ');
        return t('audit.reject.bultoLineItems', { number: b.number, items });
      })
      .join('\n');
  }, [order, bultoReviews, checkedItems, mixedBultoIds, t]);

  const setBultoReview = useCallback((bultoId: string, status: BultoAuditStatus) => {
    Haptics.selectionAsync();
    setBultoReviews((prev) => ({ ...prev, [bultoId]: status }));
    // Decidirlo a mano lo saca de la selección en bloque.
    setSelectedBultoIds((prev) => {
      if (!prev.has(bultoId)) return prev;
      const next = new Set(prev);
      next.delete(bultoId);
      return next;
    });
  }, []);

  const approveBulto = useCallback(
    (bultoId: string) => setBultoReview(bultoId, 'approved'),
    [setBultoReview],
  );
  const rejectBulto = useCallback(
    (bultoId: string) => setBultoReview(bultoId, 'rejected'),
    [setBultoReview],
  );

  const toggleSelectBulto = useCallback((bultoId: string) => {
    setSelectedBultoIds((prev) => {
      const next = new Set(prev);
      if (next.has(bultoId)) next.delete(bultoId);
      else next.add(bultoId);
      return next;
    });
  }, []);

  const toggleSelectMany = useCallback((bultoIds: string[]) => {
    setSelectedBultoIds((prev) => {
      const next = new Set(prev);
      const allSelected = bultoIds.every((id) => prev.has(id));
      for (const id of bultoIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }, []);

  const setItemChecked = useCallback((bultoId: string, itemId: string, checked: boolean) => {
    setCheckedItems((prev) => {
      const current = prev[bultoId] ?? [];
      const next = checked
        ? [...current.filter((id) => id !== itemId), itemId]
        : current.filter((id) => id !== itemId);
      return { ...prev, [bultoId]: next };
    });
    // Un aprobado exige todo tildado: destildar algo lo devuelve a pendiente.
    if (!checked) {
      setBultoReviews((prev) =>
        prev[bultoId] === 'approved' ? { ...prev, [bultoId]: null } : prev,
      );
    }
  }, []);

  const applyToSelected = (status: Exclude<BultoAuditStatus, null>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBultoReviews((prev) => {
      const next = { ...prev };
      for (const id of selectedBultoIds) next[id] = status;
      return next;
    });
    setSelectedBultoIds(new Set());
  };

  /**
   * Re-revisión: el pedido vuelve a la cola tras un rechazo previo. Los bultos
   * que ya se habían aprobado no se revisan de cero; llegan premarcados como
   * aprobados (y colapsados) y solo los corregidos quedan pendientes.
   */
  const isReReview = Boolean(order && wasCorrectedAfterRejection(order));

  /**
   * Firma de la revisión previa. El pedido llega del store y el listener puede
   * actualizarlo después de montada la pantalla, así que el premarcado no se
   * puede atar solo al id: si se atara, una primera versión sin
   * `approved_bundles` dejaría todo pendiente para siempre. Cambia solo cuando
   * cambia la auditoría, no en cada snapshot, así que no pisa lo que el
   * chequeador vaya marcando.
   */
  const auditSignature = order
    ? `${order.id}:${order.status}:${order.approvedBundles.join(',')}`
    : '';

  const seededOrderRef = useRef<string | null>(null);
  useEffect(() => {
    if (!order || seededOrderRef.current === auditSignature) return;
    seededOrderRef.current = auditSignature;

    setSelectedBultoIds(new Set());

    if (!isReReview) {
      setBultoReviews({});
      setCheckedItems({});
      return;
    }

    // Solo se premarca lo que se aprobó antes. Un bulto que el picker haya
    // abierto durante la corrección no está en esa lista y queda pendiente.
    const seeded: Record<string, BultoAuditStatus> = {};
    const seededChecks: Record<string, string[]> = {};
    for (const bulto of order.bultos) {
      if (order.approvedBundles.includes(bulto.number)) {
        seeded[bulto.id] = 'approved';
        seededChecks[bulto.id] = bulto.items.map((item) => item.id);
      }
    }
    setBultoReviews(seeded);
    setCheckedItems(seededChecks);
  }, [order, isReReview, auditSignature]);

  const approvedBundles = order?.approvedBundles;
  const isBultoExpandedByDefault = useCallback(
    (bulto: Bulto) => isReReview && !(approvedBundles ?? []).includes(bulto.number),
    [isReReview, approvedBundles],
  );

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: SCREEN_BG }]}>
        <Text>{t('audit.detail.notFound')}</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.centered, { backgroundColor: SCREEN_BG }]}>
        {loading ? (
          <ActivityIndicator size="large" color="#111827" />
        ) : (
          <Text>{t('audit.detail.notFound')}</Text>
        )}
      </View>
    );
  }

  const alreadyProcessed = order.status === 'audited' || order.status === 'rejected_review';
  // El dock de aprobar/rechazar solo aplica cuando el pedido ya está empaquetado
  // (antes se asumía con !alreadyProcessed, pero ahora esta pantalla también se
  // abre para pedidos in_progress pausados, que no deben mostrar ese dock).
  const canReviewAudit = order.status === 'to_pack';
  const bundleVariation = order.bundlesCreated !== order.definedBultos;
  const showComparison = comparisonRows.length > 0;
  const comparisonHasIssues = hasComparisonIssues(comparisonRows);

  const handleApprove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    approveAudit(order.id);
    setConfirmApprove(false);
    router.back();
  };

  const handleReject = (observation: string) => {
    const rejectedBundles = order.bultos
      .filter((b) => bultoReviews[b.id] === 'rejected')
      .map((b) => b.number);
    const approvedBundles = order.bultos
      .filter((b) => bultoReviews[b.id] === 'approved')
      .map((b) => b.number);
    rejectAudit(order.id, user.uid, user.name, observation, rejectedBundles, approvedBundles);
    setRejectSheetVisible(false);
    router.back();
  };

  const handleResumePicking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resumePicking(order.id);
    router.back();
  };

  /**
   * El pedido se resuelve solo cuando TODOS los bultos están revisados, y el
   * resultado ya está determinado por ellos: basta un bulto rechazado para que
   * el pedido se rechace. Por eso no se muestran dos botones (uno de ellos
   * siempre inhabilitado), sino la única acción que aplica, y recién cuando no
   * queda ningún bulto pendiente.
   */
  const selectedCount = canReviewAudit ? selectedBultoIds.size : 0;
  const showBulkDock = selectedCount > 0;
  const showAuditDock = canReviewAudit && allReviewed && !showBulkDock;
  const showResumeDock = !canReviewAudit && order.isPaused;
  const dualActionsHeight =
    showBulkDock || showAuditDock || showResumeDock
      ? estimateOrderActionsHeight(1, insets.bottom)
      : 0;

  const headerMeta = [
    { label: t('audit.detail.picker'), value: pickerName },
    {
      label: t('audit.detail.bultos'),
      value: `${order.bultos.length}/${order.definedBultos}`,
    },
    { label: t('audit.detail.packedAt'), value: formatPackedAt(order.packedAt) },
  ];

  const extraBultosFooter = order.hasExtraBultos ? (
    <View style={styles.extraFlag}>
      <AlertCircle size={14} color="#B45309" strokeWidth={2.2} />
      <Text style={styles.extraFlagText}>{t('audit.detail.extraBultosFlag')}</Text>
    </View>
  ) : null;

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
        meta={headerMeta}
        metaInScroll
      />

      <OrderDetailBodyFade style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: dualActionsHeight > 0 ? dualActionsHeight + 8 : 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <OrderDetailMetaCard
            meta={headerMeta}
            footer={extraBultosFooter}
            style={styles.scrollMetaCard}
          />

          {order.isPaused && order.pauseInfo ? (
            <OrderDetailAlertBanner
              title={t('picking.pause.bannerTitle')}
              body={t(pauseBannerBodyKey(order.pauseInfo.reason), {
                skus: order.pauseInfo.missingSkus.join(', '),
              })}
              author={order.pauseInfo.authorName}
            />
          ) : null}

          {bundleVariation ? (
            <OrderDetailAlertBanner
              title={t('audit.detail.bundleVariationTitle')}
              body={t('audit.detail.bundleVariationBody', {
                created: order.bundlesCreated,
                defined: order.definedBultos,
              })}
            />
          ) : null}

          {order.auditObservations.length > 0 ? (
            <OrderDetailSection
              title={t('audit.detail.observationsTitle')}
              icon={MessageSquareWarning}
            >
              {order.auditObservations.map((obs) => (
                <OrderDetailAlertBanner
                  key={obs.id}
                  title={obs.auditorName}
                  body={obs.text}
                  author={new Date(obs.createdAt).toLocaleString('es-ES')}
                />
              ))}
            </OrderDetailSection>
          ) : null}

          <OrderDetailSection
            title={t('picking.detail.linesTitle')}
            icon={ClipboardList}
            collapsible
            defaultExpanded={false}
            badge={String(originalLines.length)}
          >
            <OrderDetailCard>
              {originalLines.map((line, idx) => (
                <View
                  key={line.id}
                  style={[styles.lineRow, idx < originalLines.length - 1 && styles.lineRowBorder]}
                >
                  <View style={styles.lineInfo}>
                    <ExpandableText style={styles.lineName} numberOfLines={2}>
                      {line.name}
                    </ExpandableText>
                    <Text style={styles.lineSku}>{line.sku}</Text>
                  </View>
                  <View style={styles.lineActions}>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPreviewLine(line);
                      }}
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel={t('picking.skuPreview.open')}
                      style={({ pressed }) => [styles.eyeBtn, pressed && { opacity: 0.5 }]}
                    >
                      <Eye size={18} color="#8E8E93" strokeWidth={2.2} />
                    </Pressable>
                    <Text style={styles.lineQty}>×{line.requiredQty}</Text>
                  </View>
                </View>
              ))}
            </OrderDetailCard>
          </OrderDetailSection>

          {showComparison ? (
            <OrderDetailSection
              title={t('audit.detail.comparisonTitle')}
              icon={GitCompare}
              collapsible
              defaultExpanded={false}
              badge={
                comparisonHasIssues
                  ? t('audit.detail.comparisonBadgeIssues')
                  : t('audit.detail.comparisonBadgeOk')
              }
              badgeTone={comparisonHasIssues ? 'warning' : 'success'}
            >
              {comparisonHasIssues ? (
                <View style={styles.comparisonAlert}>
                  <AlertCircle size={14} color="#B45309" strokeWidth={2.2} />
                  <Text style={styles.comparisonAlertText}>
                    {t('audit.detail.comparisonAlert')}
                  </Text>
                </View>
              ) : (
                <View style={styles.comparisonOk}>
                  <CheckCircle2 size={14} color="#16A34A" strokeWidth={2.2} />
                  <Text style={styles.comparisonOkText}>{t('audit.detail.comparisonOk')}</Text>
                </View>
              )}
              <AuditComparisonCard rows={comparisonRows} onPreviewRow={handlePreviewLineId} />
            </OrderDetailSection>
          ) : null}

          <OrderDetailSection
            title={t('audit.detail.bultosTitle')}
            icon={Package}
            collapsible
            badge={String(order.bultos.length)}
          >
            {order.bultos.length === 0 ? (
              <OrderDetailCard>
                <Text style={styles.emptyBultos}>{t('audit.bulto.empty')}</Text>
              </OrderDetailCard>
            ) : (
              // La firma entra en las keys para que, si la auditoría previa llega
              // después del primer render, se remonten y recalculen si abren
              // abiertos o colapsados.
              bultoEntries.map((entry) =>
                entry.kind === 'group' ? (
                  <AuditBultoGroup
                    key={`${entry.key}:${auditSignature}`}
                    sku={entry.sku}
                    name={entry.name}
                    bultos={entry.bultos}
                    reviews={bultoReviews}
                    selectedIds={selectedBultoIds}
                    readOnly={alreadyProcessed}
                    selectable={canReviewAudit}
                    defaultExpanded={entry.bultos.some(isBultoExpandedByDefault)}
                    isBultoExpandedByDefault={isBultoExpandedByDefault}
                    onApprove={approveBulto}
                    onReject={rejectBulto}
                    onToggleSelect={toggleSelectBulto}
                    onToggleSelectMany={toggleSelectMany}
                    onPreviewItem={handlePreviewLineId}
                  />
                ) : (
                  <AuditBultoAccordion
                    key={`${entry.key}:${auditSignature}`}
                    bulto={entry.bulto}
                    reviewStatus={bultoReviews[entry.bulto.id] ?? null}
                    readOnly={alreadyProcessed}
                    defaultExpanded={isBultoExpandedByDefault(entry.bulto)}
                    onApprove={approveBulto}
                    onReject={rejectBulto}
                    onPreviewItem={handlePreviewLineId}
                    selectable={canReviewAudit && !entry.mixed}
                    selected={selectedBultoIds.has(entry.bulto.id)}
                    onToggleSelect={toggleSelectBulto}
                    itemCheckable={canReviewAudit && entry.mixed}
                    checkedItemIds={checkedItems[entry.bulto.id]}
                    onToggleItem={setItemChecked}
                  />
                ),
              )
            )}
          </OrderDetailSection>
        </ScrollView>
      </OrderDetailBodyFade>

      {showBulkDock ? (
        <View style={[styles.dualDock, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.dualBtn}>
            <OrderActionButton
              label={t('audit.bulk.reject', { count: selectedCount })}
              onPress={() => applyToSelected('rejected')}
              variant="secondary"
              icon={XCircle}
            />
          </View>
          <View style={styles.dualBtn}>
            <OrderActionButton
              label={t('audit.bulk.approve', { count: selectedCount })}
              onPress={() => applyToSelected('approved')}
              variant="primary"
              icon={CheckCircle2}
            />
          </View>
        </View>
      ) : showAuditDock ? (
        <View style={[styles.dualDock, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.dualBtn}>
            {allApproved ? (
              <OrderActionButton
                label={t('audit.approve.orderBtn')}
                onPress={() => setConfirmApprove(true)}
                variant="primary"
                icon={CheckCircle2}
              />
            ) : (
              <OrderActionButton
                label={t('audit.reject.orderBtn')}
                onPress={() => {
                  Haptics.selectionAsync();
                  setRejectSheetVisible(true);
                }}
                variant="secondary"
                icon={XCircle}
              />
            )}
          </View>
        </View>
      ) : showResumeDock ? (
        <View style={[styles.dualDock, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.dualBtn}>
            <OrderActionButton
              label={t('picking.detail.resumePicking')}
              onPress={handleResumePicking}
              variant="primary"
              icon={Play}
            />
          </View>
        </View>
      ) : null}

      <ConfirmSheet
        visible={confirmApprove}
        title={t('audit.approve.title')}
        message={t('audit.approve.body', { order: order.orderNumber })}
        mode="confirm"
        confirmLabel={t('audit.approve.confirm')}
        icon={CheckCircle2}
        onConfirm={handleApprove}
        onClose={() => setConfirmApprove(false)}
      />

      <RejectObservationSheet
        visible={rejectSheetVisible}
        onClose={() => setRejectSheetVisible(false)}
        onConfirm={handleReject}
        initialText={rejectPrefill}
      />

      <SkuPreviewSheet line={previewLine} onClose={() => setPreviewLine(null)} />
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
    paddingTop: 0,
  },
  scrollMetaCard: {
    marginHorizontal: 0,
    marginTop: 12,
    marginBottom: 16,
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
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
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
  lineInfo: {
    flex: 1,
    marginRight: 8,
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
  lineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eyeBtn: {
    padding: 2,
  },
  comparisonAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  comparisonAlertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    lineHeight: 17,
  },
  comparisonOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  comparisonOkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  emptyBultos: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 16,
  },
  dualDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: SCREEN_BG,
  },
  dualBtn: {
    flex: 1,
  },
});
