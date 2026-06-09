import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import type { PickerEstado } from '@/features/warehouse/types';
import { pickerStatusLabelKey } from '@/features/warehouse/utils/picker-status';
import { Text } from '@/shared/components/ui/text';
import { useTheme } from '@/theme';

interface AvailablePickerRowProps {
  picker: PickerEstado;
  selected: boolean;
  onToggle: (uid: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  disponible: '#16A34A',
  en_proceso: '#D97706',
  reservado: '#7C3AED',
  por_embalar: '#2563EB',
};

export function AvailablePickerRow({ picker, selected, onToggle }: AvailablePickerRowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const statusColor = STATUS_COLORS[picker.status] ?? theme.mutedForeground;

  return (
    <Pressable
      onPress={() => onToggle(picker.uid)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: selected ? theme.primary : theme.border,
        backgroundColor: selected ? `${theme.primary}12` : theme.card,
        marginBottom: 8,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {/* Avatar */}
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: selected ? theme.primary : theme.muted,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: selected ? '#fff' : theme.foreground }}>
          {picker.nombre.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.foreground }}>{picker.nombre}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: statusColor }} />
          <Text style={{ fontSize: 12, color: statusColor, fontWeight: '500' }}>
            {t(pickerStatusLabelKey(picker.status))}
          </Text>
          <Text style={{ fontSize: 12, color: theme.mutedForeground }}>
            · {picker.bultosToday} {t('teams.bultosToday')}
          </Text>
        </View>
      </View>

      {/* Check */}
      {selected && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: theme.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={14} color="#fff" strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
}
