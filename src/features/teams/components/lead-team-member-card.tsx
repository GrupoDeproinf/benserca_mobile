import * as Haptics from 'expo-haptics';
import { UserMinus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PickerEstado } from '@/features/warehouse/types';
import { pickerStatusLabelKey } from '@/features/warehouse/utils/picker-status';

interface LeadTeamMemberCardProps {
  picker: PickerEstado;
  onRelease: () => void;
}

export function LeadTeamMemberCard({ picker, onRelease }: LeadTeamMemberCardProps) {
  const { t } = useTranslation();
  const initial = picker.nombre.charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {picker.nombre}
        </Text>
        <Text style={styles.status}>{t(pickerStatusLabelKey(picker.status))}</Text>
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onRelease();
        }}
        hitSlop={10}
        style={({ pressed }) => [styles.releaseBtn, pressed && { opacity: 0.7 }]}
        accessibilityLabel={t('teams.releasePicker.confirm')}
      >
        <UserMinus size={18} color="#DC2626" strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  status: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  releaseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
