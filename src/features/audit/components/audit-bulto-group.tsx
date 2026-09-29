import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Bulto } from '@/features/picking/types';
import { ExpandableText } from '@/shared/components/ui/expandable-text';
import { AuditBultoAccordion, type BultoAuditStatus } from './audit-bulto-accordion';
import { SelectionCheck, type SelectionCheckState } from './selection-check';

interface AuditBultoGroupProps {
  sku: string;
  name: string;
  bultos: Bulto[];
  reviews: Record<string, BultoAuditStatus>;
  selectedIds: ReadonlySet<string>;
  readOnly: boolean;
  selectable: boolean;
  defaultExpanded?: boolean;
  /** En una re-revisión, los bultos corregidos llegan abiertos. */
  isBultoExpandedByDefault?: (bulto: Bulto) => boolean;
  onApprove: (bultoId: string) => void;
  onReject: (bultoId: string) => void;
  onToggleSelect: (bultoId: string) => void;
  onToggleSelectMany: (bultoIds: string[]) => void;
  onPreviewItem?: (lineId: string) => void;
}

function bultoUnits(bulto: Bulto): number {
  return bulto.items.reduce((sum, item) => sum + item.qty, 0);
}

export const AuditBultoGroup = memo(function AuditBultoGroup({
  sku,
  name,
  bultos,
  reviews,
  selectedIds,
  readOnly,
  selectable,
  defaultExpanded = false,
  isBultoExpandedByDefault,
  onApprove,
  onReject,
  onToggleSelect,
  onToggleSelectMany,
  onPreviewItem,
}: AuditBultoGroupProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);

  let approved = 0;
  let rejected = 0;
  for (const bulto of bultos) {
    if (reviews[bulto.id] === 'approved') approved += 1;
    else if (reviews[bulto.id] === 'rejected') rejected += 1;
  }
  const pending = bultos.length - approved - rejected;

  // "Seleccionar todos" nunca incluye los rechazados: si no, aprobar en bloque
  // pisaría el rechazo que el chequeador acaba de hacer a mano.
  const selectableIds = bultos.filter((b) => reviews[b.id] !== 'rejected').map((b) => b.id);
  const selectedCount = selectableIds.filter((id) => selectedIds.has(id)).length;
  const groupCheck: SelectionCheckState =
    selectedCount === 0 ? false : selectedCount === selectableIds.length ? true : 'mixed';

  const firstUnits = bultoUnits(bultos[0]);
  const sameUnits = bultos.every((b) => bultoUnits(b) === firstUnits);

  const meta = [
    sku,
    t('audit.group.bultoCount', { count: bultos.length }),
    sameUnits ? t('audit.group.unitsEach', { qty: firstUnits }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.card, selectedCount > 0 && styles.cardSelected]}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={styles.header}>
        {selectable && !readOnly ? (
          <View style={styles.selectSlot}>
            <SelectionCheck
              checked={groupCheck}
              disabled={selectableIds.length === 0}
              onToggle={() => onToggleSelectMany(selectableIds)}
              accessibilityLabel={t('audit.group.selectAll', { name })}
            />
          </View>
        ) : null}
        <View style={styles.headerInfo}>
          <ExpandableText style={styles.name} numberOfLines={2}>
            {name}
          </ExpandableText>
          <Text style={styles.meta}>{meta}</Text>
          <View style={styles.pills}>
            {approved > 0 ? (
              <View style={[styles.pill, styles.pillApproved]}>
                <Text style={[styles.pillText, styles.pillTextApproved]}>
                  {t('audit.group.approvedCount', { count: approved })}
                </Text>
              </View>
            ) : null}
            {rejected > 0 ? (
              <View style={[styles.pill, styles.pillRejected]}>
                <Text style={[styles.pillText, styles.pillTextRejected]}>
                  {t('audit.group.rejectedCount', { count: rejected })}
                </Text>
              </View>
            ) : null}
            {pending > 0 ? (
              <View style={[styles.pill, styles.pillPending]}>
                <Text style={[styles.pillText, styles.pillTextPending]}>
                  {t('audit.group.pendingCount', { count: pending })}
                </Text>
              </View>
            ) : null}
            {selectedCount > 0 ? (
              <View style={[styles.pill, styles.pillSelected]}>
                <Text style={[styles.pillText, styles.pillTextSelected]}>
                  {t('audit.group.selectedCount', { count: selectedCount })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={18} color="#8E8E93" strokeWidth={2.2} />
        ) : (
          <ChevronDown size={18} color="#8E8E93" strokeWidth={2.2} />
        )}
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {bultos.map((bulto) => (
            <AuditBultoAccordion
              key={bulto.id}
              bulto={bulto}
              reviewStatus={reviews[bulto.id] ?? null}
              readOnly={readOnly}
              defaultExpanded={isBultoExpandedByDefault?.(bulto) ?? false}
              onApprove={onApprove}
              onReject={onReject}
              onPreviewItem={onPreviewItem}
              selectable={selectable}
              selected={selectedIds.has(bulto.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  selectSlot: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillApproved: {
    backgroundColor: '#DCFCE7',
  },
  pillTextApproved: {
    color: '#15803D',
  },
  pillRejected: {
    backgroundColor: '#FEE2E2',
  },
  pillTextRejected: {
    color: '#B91C1C',
  },
  pillPending: {
    backgroundColor: '#E5E5EA',
  },
  pillTextPending: {
    color: '#6B7280',
  },
  pillSelected: {
    backgroundColor: '#111827',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
});
