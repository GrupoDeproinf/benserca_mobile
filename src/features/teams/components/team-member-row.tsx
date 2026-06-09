import * as Haptics from 'expo-haptics';
import { UserMinus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import type { PickerEstado } from '@/features/warehouse/types';
import { pickerStatusLabelKey } from '@/features/warehouse/utils/picker-status';
import { Text } from '@/shared/components/ui/text';
import { useTheme } from '@/theme';

interface TeamMemberRowProps {
  picker: PickerEstado;
  onRelease: (uid: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  disponible: '#16A34A',
  en_proceso: '#D97706',
  reservado: '#7C3AED',
  por_embalar: '#2563EB',
};

const STATUS_BG: Record<string, string> = {
  disponible: '#F0FDF4',
  en_proceso: '#FFFBEB',
  reservado: '#F5F3FF',
  por_embalar: '#EFF6FF',
};

export function TeamMemberRow({ picker, onRelease }: TeamMemberRowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const statusColor = STATUS_COLORS[picker.status] ?? theme.mutedForeground;
  const statusBg = STATUS_BG[picker.status] ?? theme.muted;

  const handleRelease = () => {
    Alert.alert(
      t('teams.releasePicker.title'),
      t('teams.releasePicker.body', { name: picker.nombre }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('teams.releasePicker.confirm'),
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRelease(picker.uid);
          },
        },
      ],
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.card,
        marginBottom: 8,
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: theme.muted,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.foreground }}>
          {picker.nombre.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.foreground }}>{picker.nombre}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
              backgroundColor: statusBg,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>
              {t(pickerStatusLabelKey(picker.status))}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: theme.mutedForeground }}>
            · {picker.bultosToday} {t('teams.bultosToday')}
          </Text>
        </View>
      </View>

      {/* Release button */}
      <Pressable
        onPress={handleRelease}
        hitSlop={12}
        style={({ pressed }) => ({
          padding: 8,
          borderRadius: 10,
          backgroundColor: pressed ? '#FEE2E2' : '#FEF2F2',
        })}
      >
        <UserMinus size={18} color="#DC2626" />
      </Pressable>
    </View>
  );
}
