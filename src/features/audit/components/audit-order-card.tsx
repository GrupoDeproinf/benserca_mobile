import { useRouter } from 'expo-router';
import { Box, Calendar, ChevronRight, ClipboardList, User } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { Order } from '@/features/picking/types';

interface AuditOrderCardProps {
  order: Order;
  pickerName?: string;
}

const META_ICON_SIZE = 18;

function formatPackedDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function splitDisplayName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '—', lastName: '' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function MetaBlock({
  icon,
  label,
  value,
  valueLines,
  blockStyle,
  iconBoxStyle,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  valueLines?: { primary: string; secondary: string };
  blockStyle?: ViewStyle;
  iconBoxStyle?: ViewStyle;
}) {
  return (
    <View style={[styles.metaBlock, blockStyle]}>
      <View style={[styles.metaIconBox, iconBoxStyle]}>{icon}</View>
      <View style={styles.metaTextWrap}>
        <Text style={styles.metaLabel} numberOfLines={1}>
          {label}
        </Text>
        {valueLines ? (
          <>
            <Text style={styles.metaValue} numberOfLines={1}>
              {valueLines.primary}
            </Text>
            {valueLines.secondary ? (
              <Text style={styles.metaValueSecondary} numberOfLines={1}>
                {valueLines.secondary}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.metaValue} numberOfLines={1}>
            {value ?? '—'}
          </Text>
        )}
      </View>
    </View>
  );
}

/** Card de pedido en cola de auditoría — mismo lenguaje que pedidos. */
export function AuditOrderCard({ order, pickerName }: AuditOrderCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pickerDisplay = splitDisplayName(pickerName ?? '');

  return (
    <Pressable
      onPress={() => router.push(`/(app)/auditor/audit/${order.id}` as never)}
      style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBoxLarge}>
            <ClipboardList size={20} color="#6B7280" strokeWidth={2} />
          </View>

          <View style={styles.headerBody}>
            <View style={styles.titleRow}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              {order.hasExtraBultos ? (
                <View style={styles.extraBadge}>
                  <Text style={styles.extraBadgeText}>{t('audit.card.extraBultos')}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.client} numberOfLines={1}>
              {order.client}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{t('orderStatus.packed')}</Text>
            </View>
            <ChevronRight size={18} color="#C7C7CC" strokeWidth={2} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <MetaBlock
            icon={<User size={META_ICON_SIZE} color="#6B7280" strokeWidth={2} />}
            label={t('audit.card.picker')}
            valueLines={{
              primary: pickerDisplay.firstName,
              secondary: pickerDisplay.lastName,
            }}
          />
          <MetaBlock
            icon={<Box size={META_ICON_SIZE} color="#6B7280" strokeWidth={2} />}
            label={t('audit.card.bultos')}
            value={String(order.bultos.length)}
          />
          <MetaBlock
            icon={<Calendar size={META_ICON_SIZE} color="#6B7280" strokeWidth={2} />}
            label={t('audit.card.packed')}
            value={formatPackedDate(order.packedAt ?? null)}
            blockStyle={styles.packedMetaBlock}
            iconBoxStyle={styles.packedIconBox}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
  },
  iconBoxLarge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  extraBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  extraBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  client: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 8,
  },
  metaBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  metaIconBox: {
    width: 40,
    height: 44,
    borderRadius: 11,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingTop: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: '#8E8E93',
    lineHeight: 14,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 14,
    marginTop: 2,
  },
  metaValueSecondary: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 14,
    marginTop: 1,
  },
  packedMetaBlock: {
    marginLeft: -6,
  },
  packedIconBox: {
    marginLeft: -2,
  },
});
