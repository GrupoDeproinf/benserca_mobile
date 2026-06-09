import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { PickerStatus } from '@/features/warehouse/types';
import { Text } from '@/shared/components/ui/text';

interface SummaryCount {
  status: PickerStatus;
  count: number;
}

interface WarehouseSummaryStripProps {
  counts: SummaryCount[];
  total: number;
}

const STATUS_STYLES: Record<PickerStatus, { bg: string; text: string; dot: string }> = {
  disponible:  { bg: '#F0FDF4', text: '#166534', dot: '#16A34A' },
  en_proceso:  { bg: '#FFFBEB', text: '#92400E', dot: '#D97706' },
  reservado:   { bg: '#F5F3FF', text: '#4C1D95', dot: '#7C3AED' },
  por_embalar: { bg: '#EFF6FF', text: '#1E40AF', dot: '#2563EB' },
};

export function WarehouseSummaryStrip({ counts, total }: WarehouseSummaryStripProps) {
  const { t } = useTranslation();

  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {/* Total */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: 'rgba(255,255,255,0.18)',
          alignItems: 'center',
          minWidth: 60,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{total}</Text>
        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('supervision.summary.total')}
        </Text>
      </View>

      {counts.map(({ status, count }) => {
        const s = STATUS_STYLES[status];
        return (
          <View
            key={status}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              minWidth: 60,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.dot }} />
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>{count}</Text>
            </View>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t(`supervision.summary.${status}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
