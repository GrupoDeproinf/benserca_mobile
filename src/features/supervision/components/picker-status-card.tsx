import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { pickerStatusLabelKey } from '@/features/warehouse/utils/picker-status';
import type { PickerEstado, PickerStatus } from '@/features/warehouse/types';
import { Text } from '@/shared/components/ui/text';
import { useElapsedSince } from '../hooks/use-elapsed-since';

interface PickerStatusCardProps {
  picker: PickerEstado;
  activeOrderNumber?: string;
  activeOrderClient?: string;
}

const STATUS_PALETTE: Record<PickerStatus, { accent: string; bg: string; label: string }> = {
  disponible: { accent: '#16A34A', bg: '#F0FDF4', label: '#166534' },
  en_proceso: { accent: '#D97706', bg: '#FFFBEB', label: '#92400E' },
  reservado: { accent: '#7C3AED', bg: '#F5F3FF', label: '#4C1D95' },
  por_embalar: { accent: '#2563EB', bg: '#EFF6FF', label: '#1E40AF' },
};

export function PickerStatusCard({
  picker,
  activeOrderNumber,
  activeOrderClient,
}: PickerStatusCardProps) {
  const { t } = useTranslation();
  const elapsed = useElapsedSince(picker.updatedAt);
  const palette = STATUS_PALETTE[picker.status];

  return (
    <View style={[styles.card, { borderLeftColor: palette.accent }]}>
      <View style={styles.topRow}>
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: palette.bg, borderColor: palette.accent }]}>
            <Text style={[styles.avatarText, { color: palette.label }]}>
              {picker.nombre.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name} numberOfLines={1}>
              {picker.nombre}
            </Text>
            {activeOrderNumber && picker.status !== 'disponible' ? (
              <>
                <Text style={styles.orderNumber} numberOfLines={1}>
                  {activeOrderNumber}
                </Text>
                {activeOrderClient ? (
                  <Text style={styles.client} numberOfLines={1}>
                    {activeOrderClient}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.noOrder}>{t('supervision.card.noActiveOrder')}</Text>
            )}
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: palette.bg }]}>
          <Text style={[styles.badgeText, { color: palette.label }]}>
            {t(pickerStatusLabelKey(picker.status))}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.metaLabel}>{t('supervision.card.timeInStatus')}</Text>
          <Text style={styles.metaValue}>{elapsed}</Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.metaLabel}>{t('supervision.card.bultosToday')}</Text>
          <Text style={styles.metaValue}>{picker.bultosToday}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    borderLeftWidth: 4,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 20,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  client: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  noOrder: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: '#F3F4F6',
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 10,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
});
