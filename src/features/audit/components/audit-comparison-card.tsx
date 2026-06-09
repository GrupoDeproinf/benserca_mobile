import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { OrderDetailCard } from '@/features/picking/components/order-detail-section';
import type { AuditComparisonRow } from '../utils/audit-comparison';

const STATUS_COLOR = {
  ok: '#16A34A',
  over: '#B45309',
  under: '#DC2626',
} as const;

interface AuditComparisonCardProps {
  rows: AuditComparisonRow[];
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendChip}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function DiffBadge({ diff, status }: { diff: number; status: AuditComparisonRow['status'] }) {
  const color = STATUS_COLOR[status];
  const label = diff === 0 ? '0' : diff > 0 ? `+${diff}` : `${diff}`;

  return (
    <View style={[styles.diffBadge, { backgroundColor: `${color}18` }]}>
      <Text style={[styles.diffText, { color }]}>{label}</Text>
    </View>
  );
}

export function AuditComparisonCard({ rows }: AuditComparisonCardProps) {
  const { t } = useTranslation();

  return (
    <OrderDetailCard>
      <View style={styles.legendRow}>
        <LegendChip color={STATUS_COLOR.ok} label={t('audit.detail.legendOk')} />
        <LegendChip color={STATUS_COLOR.over} label={t('audit.detail.legendOver')} />
        <LegendChip color={STATUS_COLOR.under} label={t('audit.detail.legendUnder')} />
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.colLabel, styles.colProduct]}>{t('audit.detail.colProduct')}</Text>
        <Text style={styles.colLabel}>{t('audit.detail.colRequired')}</Text>
        <Text style={styles.colLabel}>{t('audit.detail.colPicked')}</Text>
        <Text style={styles.colLabel}>{t('audit.detail.colDiff')}</Text>
      </View>

      {rows.map((row, idx) => (
        <View
          key={row.sku}
          style={[styles.row, idx < rows.length - 1 && styles.rowBorder]}
        >
          <View style={styles.colProduct}>
            <Text style={styles.productName} numberOfLines={2}>
              {row.name}
            </Text>
            <Text style={styles.productSku}>{row.sku}</Text>
          </View>
          <Text style={styles.qtyCell}>{row.required}</Text>
          <Text style={[styles.qtyCell, styles.qtyPicked, { color: STATUS_COLOR[row.status] }]}>
            {row.picked}
          </Text>
          <DiffBadge diff={row.diff} status={row.status} />
        </View>
      ))}
    </OrderDetailCard>
  );
}

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#F3F4F6',
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  colLabel: {
    width: 52,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  colProduct: {
    flex: 1,
    width: undefined,
    textAlign: 'left',
    paddingRight: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: '#F3F4F6',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },
  productSku: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  qtyCell: {
    width: 52,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  qtyPicked: {
    fontWeight: '800',
  },
  diffBadge: {
    width: 52,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
  },
  diffText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
