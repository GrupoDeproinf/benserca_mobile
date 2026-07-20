import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { pickerStatusLabelKey } from '@/features/warehouse/utils/picker-status';
import type { PickerEstado, PickerStatus } from '@/features/warehouse/types';
import { Text } from '@/shared/components/ui/text';

interface AssignPickerListRowProps {
  picker: PickerEstado;
  selected: boolean;
  onPress: () => void;
}

const STATUS_PALETTE: Record<PickerStatus, { accent: string; bg: string; label: string }> = {
  disponible: { accent: '#16A34A', bg: '#F0FDF4', label: '#166534' },
  en_proceso: { accent: '#D97706', bg: '#FFFBEB', label: '#92400E' },
  reservado: { accent: '#7C3AED', bg: '#F5F3FF', label: '#4C1D95' },
  por_embalar: { accent: '#2563EB', bg: '#EFF6FF', label: '#1E40AF' },
};

/** Fila de picker — mismo lenguaje que `PickerStatusCard`, con selección sutil. */
export function AssignPickerListRow({ picker, selected, onPress }: AssignPickerListRowProps) {
  const { t } = useTranslation();
  const palette = STATUS_PALETTE[picker.status];

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => [pressed && { opacity: 0.94 }]}
    >
      <View
        style={[
          styles.card,
          { borderLeftColor: selected ? '#111827' : palette.accent },
          selected && styles.cardSelected,
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.identity}>
            <View style={styles.avatarWrap}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: palette.bg, borderColor: palette.accent },
                ]}
              >
                <Text style={[styles.avatarText, { color: palette.label }]}>
                  {picker.nombre.charAt(0).toUpperCase()}
                </Text>
              </View>
              {selected ? (
                <View style={styles.checkBadge}>
                  <Check size={11} color="#FFFFFF" strokeWidth={3} />
                </View>
              ) : null}
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {picker.nombre}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              selected ? styles.badgeSelected : { backgroundColor: palette.bg },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: selected ? '#FFFFFF' : palette.label },
              ]}
            >
              {selected ? t('teams.assign.selectedBadge') : t(pickerStatusLabelKey(picker.status))}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const CARD_BORDER = StyleSheet.hairlineWidth * 2;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: CARD_BORDER,
    borderColor: '#E5E5EA',
    borderLeftWidth: 4,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardSelected: {
    borderColor: '#111827',
    backgroundColor: '#FAFAFA',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexShrink: 0,
    minWidth: 88,
    alignItems: 'center',
  },
  badgeSelected: {
    backgroundColor: '#111827',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
