import * as Haptics from 'expo-haptics';
import { AlertTriangle, Eye } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { ExpandableText } from '@/shared/components/ui/expandable-text';
import { Text } from '@/shared/components/ui/text';
import type { MissingItem, OrderLine } from '../types';

interface OrderLineRowProps {
  line: OrderLine;
  isLast: boolean;
  /** Unidades de este renglón ya metidas en bultos. */
  assigned: number;
  /** Faltante reportado y todavía sin resolver por la web. */
  reported: MissingItem | undefined;
  /** El picker marcó este SKU al pausar por "sku_duplicado". */
  isDuplicateSku: boolean;
  /** El pedido admite reportar faltantes (editable y sin pausa). */
  canReportMissing: boolean;
  onPreview: (line: OrderLine) => void;
  onReportMissing: (line: OrderLine) => void;
}

/**
 * Un renglón de la lista del detalle de picking.
 *
 * Es un componente propio (antes era JSX dentro del `.map` de la pantalla) para
 * que React Compiler pueda memorizar cada fila por sus props: al tocar el
 * stepper de un bulto solo cambia el `assigned` de UN renglón, y con la fila
 * en línea se redibujaban los 250 renglones de un pedido grande.
 */
export function OrderLineRow({
  line,
  isLast,
  assigned,
  reported,
  isDuplicateSku,
  canReportMissing,
  onPreview,
  onReportMissing,
}: OrderLineRowProps) {
  const { t } = useTranslation();
  const pending = Math.max(0, line.requiredQty - assigned);

  const openPreview = () => {
    Haptics.selectionAsync();
    onPreview(line);
  };

  return (
    // Mantener presionado abre la vista previa del artículo: foto y código en
    // grande, para cotejar contra la etiqueta física.
    <Pressable
      onLongPress={openPreview}
      delayLongPress={250}
      style={[
        styles.lineRow,
        !isLast && styles.lineRowBorder,
        isDuplicateSku && styles.lineRowDuplicate,
      ]}
    >
      <View style={{ flex: 1, marginRight: 8 }}>
        <ExpandableText style={styles.lineName} numberOfLines={2}>
          {line.name}
        </ExpandableText>
        <View style={styles.lineSkuRow}>
          <Text style={styles.lineSku}>{line.sku}</Text>
          {isDuplicateSku ? (
            <View style={styles.duplicateSkuTag}>
              <Text style={styles.duplicateSkuTagText}>{t('picking.detail.duplicateSkuTag')}</Text>
            </View>
          ) : null}
        </View>
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
        {/* Atajo visible al "mantener presionado". Va en esta columna y no
            junto a la meta: el ancho de la izquierda varía con el largo de la
            cantidad (×12 vs ×225), y ahí los ojos quedaban desalineados entre
            filas. */}
        <Pressable
          onPress={openPreview}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('picking.skuPreview.open')}
          style={({ pressed }) => [styles.eyeBtn, pressed && { opacity: 0.5 }]}
        >
          <Eye size={18} color="#8E8E93" strokeWidth={2.2} />
        </Pressable>
        {/* Un renglón ya reportado no se puede volver a reportar ni corregir
            desde la app: solo la web lo resuelve. */}
        {reported ? (
          <View style={styles.reportedBadge}>
            <AlertTriangle size={12} color="#B45309" strokeWidth={2.4} />
            <Text style={styles.reportedBadgeText}>
              {t('picking.missing.reportedBadge', { missing: reported.missingQty })}
            </Text>
          </View>
        ) : canReportMissing && pending > 0 ? (
          <Pressable onPress={() => onReportMissing(line)} style={styles.reportMissingBtn}>
            <AlertTriangle size={14} color="#B45309" strokeWidth={2.2} />
            <Text style={styles.reportMissingText}>{t('picking.missing.reportBtn')}</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  // Se resalta cuando el picker marcó ese SKU al pausar por "sku_duplicado",
  // para reconocerlo de un vistazo en la lista.
  lineRowDuplicate: { backgroundColor: '#EFF6FF' },
  lineName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  lineSkuRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  lineSku: { fontSize: 11, color: '#8E8E93' },
  duplicateSkuTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
  },
  duplicateSkuTagText: { fontSize: 9, fontWeight: '700', color: '#1D4ED8' },
  lineMeta: { fontSize: 11, color: '#6B7280', marginTop: 4, lineHeight: 16 },
  lineActions: { alignItems: 'flex-end', gap: 6 },
  lineQty: { fontSize: 16, fontWeight: '800', color: '#111827' },
  reportMissingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#FDE68A',
  },
  reportMissingText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  reportedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  reportedBadgeText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  eyeBtn: {
    alignSelf: 'flex-end',
    padding: 2,
  },
});
