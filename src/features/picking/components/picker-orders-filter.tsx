import { useTranslation } from 'react-i18next';
import { ScrollView, Pressable } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { useTheme } from '@/theme';
import { ORDER_STATUS_I18N_KEY } from '../utils/order-status';
import type { PickerOrderFilter } from '../hooks/use-picker-orders';
import { PICKER_FILTER_STATUSES } from '../hooks/use-picker-orders';

interface PickerOrdersFilterProps {
  value: PickerOrderFilter;
  onChange: (f: PickerOrderFilter) => void;
}

export function PickerOrdersFilter({ value, onChange }: PickerOrdersFilterProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 10 }}
    >
      {PICKER_FILTER_STATUSES.map((status) => {
        const active = value === status;
        const label =
          status === 'all' ? t('common.all') : t(ORDER_STATUS_I18N_KEY[status]);
        return (
          <Pressable
            key={status}
            onPress={() => onChange(status)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 99,
              borderWidth: 1,
              borderColor: active ? theme.primary : theme.border,
              backgroundColor: active ? theme.brandMuted : theme.card,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: active ? '700' : '500',
                color: active ? theme.primary : theme.mutedForeground,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
