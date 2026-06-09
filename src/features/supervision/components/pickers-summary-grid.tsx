import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import type { PickerStatus } from '@/features/warehouse/types';

interface SummaryCount {
  status: PickerStatus;
  count: number;
}

interface PickersSummaryGridProps {
  counts: SummaryCount[];
  total: number;
}

const STATUS_STYLES: Record<PickerStatus, { bg: string; text: string; dot: string }> = {
  disponible: { bg: '#F0FDF4', text: '#166534', dot: '#16A34A' },
  en_proceso: { bg: '#FFFBEB', text: '#92400E', dot: '#D97706' },
  reservado: { bg: '#F5F3FF', text: '#4C1D95', dot: '#7C3AED' },
  por_embalar: { bg: '#EFF6FF', text: '#1E40AF', dot: '#2563EB' },
};

/** Resumen de pickers en cards blancas (mismo lenguaje visual que pedidos). */
export function PickersSummaryGrid({ counts, total }: PickersSummaryGridProps) {
  const { t } = useTranslation();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      <SummaryChip
        value={total}
        label={t('supervision.summary.total')}
        dotColor="#111827"
        bg="#FFFFFF"
        textColor="#111827"
      />
      {counts.map(({ status, count }) => {
        const s = STATUS_STYLES[status];
        return (
          <SummaryChip
            key={status}
            value={count}
            label={t(`supervision.summary.${status}`)}
            dotColor={s.dot}
            bg={s.bg}
            textColor={s.text}
          />
        );
      })}
    </View>
  );
}

function SummaryChip({
  value,
  label,
  dotColor,
  bg,
  textColor,
}: {
  value: number;
  label: string;
  dotColor: string;
  bg: string;
  textColor: string;
}) {
  return (
    <View
      style={{
        minWidth: '30%',
        flexGrow: 1,
        backgroundColor: bg,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: textColor, lineHeight: 26 }}>
          {value}
        </Text>
      </View>
      <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4, fontWeight: '600' }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
