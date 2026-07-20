import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OrderActionButton } from '@/features/picking/components/order-action-button';
import type { Bulto } from '@/features/picking/types';

export type BultoAuditStatus = 'approved' | 'rejected' | null;

interface AuditBultoAccordionProps {
  bulto: Bulto;
  reviewStatus: BultoAuditStatus;
  readOnly?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

export function AuditBultoAccordion({
  bulto,
  reviewStatus,
  readOnly = false,
  onApprove,
  onReject,
}: AuditBultoAccordionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isClosed = bulto.status === 'closed';

  const isApproved = reviewStatus === 'approved';
  const isRejected = reviewStatus === 'rejected';

  const cardBorderStyle = isApproved
    ? styles.cardApproved
    : isRejected
      ? styles.cardRejected
      : isClosed
        ? styles.cardClosed
        : styles.cardOpen;

  return (
    <View style={[styles.card, cardBorderStyle]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={[styles.header, isClosed ? styles.headerClosed : styles.headerOpen]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{t('audit.bulto.title', { number: bulto.number })}</Text>
          {reviewStatus ? (
            <View
              style={[
                styles.reviewPill,
                isApproved ? styles.reviewPillApproved : styles.reviewPillRejected,
              ]}
            >
              <Text
                style={[
                  styles.reviewPillText,
                  isApproved ? styles.reviewTextApproved : styles.reviewTextRejected,
                ]}
              >
                {isApproved ? t('audit.bulto.reviewApproved') : t('audit.bulto.reviewRejected')}
              </Text>
            </View>
          ) : (
            <View style={styles.pendingPill}>
              <Text style={styles.pendingPillText}>{t('audit.bulto.pendingReview')}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.itemCount}>{t('audit.bulto.itemCount', { count: bulto.items.length })}</Text>
          {expanded ? (
            <ChevronUp size={18} color="#8E8E93" strokeWidth={2.2} />
          ) : (
            <ChevronDown size={18} color="#8E8E93" strokeWidth={2.2} />
          )}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {bulto.items.length === 0 ? (
            <Text style={styles.empty}>{t('audit.bulto.empty')}</Text>
          ) : (
            bulto.items.map((item, idx) => (
              <View
                key={item.id}
                style={[styles.itemRow, idx < bulto.items.length - 1 && styles.itemRowBorder]}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemSku}>{item.sku}</Text>
                </View>
                <Text style={styles.itemQty}>×{item.qty}</Text>
              </View>
            ))
          )}

          {!readOnly ? (
            <View style={styles.actions}>
              <View style={styles.actionSlot}>
                <OrderActionButton
                  label={t('audit.bulto.reject')}
                  onPress={() => {
                    if (!isRejected) onReject?.();
                  }}
                  variant="secondary"
                  size="compact"
                  icon={XCircle}
                  disabled={isRejected}
                />
              </View>
              <View style={styles.actionSlot}>
                <OrderActionButton
                  label={t('audit.bulto.approve')}
                  onPress={() => {
                    if (!isApproved) onApprove?.();
                  }}
                  variant="primary"
                  size="compact"
                  icon={CheckCircle2}
                  disabled={isApproved}
                />
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardOpen: {
    borderColor: '#E5E5EA',
  },
  cardClosed: {
    borderColor: '#E5E5EA',
  },
  cardApproved: {
    borderColor: '#86EFAC',
  },
  cardRejected: {
    borderColor: '#FCA5A5',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  reviewPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  reviewPillApproved: {
    backgroundColor: '#DCFCE7',
  },
  reviewPillRejected: {
    backgroundColor: '#FEE2E2',
  },
  reviewPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reviewTextApproved: {
    color: '#15803D',
  },
  reviewTextRejected: {
    color: '#B91C1C',
  },
  pendingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  pendingPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  itemCount: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
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
  itemInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
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
    fontWeight: '800',
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: '#F3F4F6',
  },
  actionSlot: {
    flex: 1,
  },
});
