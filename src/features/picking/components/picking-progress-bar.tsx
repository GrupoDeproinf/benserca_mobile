import { View, StyleSheet } from 'react-native';
import { Text } from '@/shared/components/ui/text';

interface PickingProgressBarProps {
  percentage: number;
  closedBultos: number;
  definedBultos: number;
  label: string;
}

export function PickingProgressBar({
  percentage,
  closedBultos,
  definedBultos,
  label,
}: PickingProgressBarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {closedBultos}/{definedBultos} · {percentage}%
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, percentage)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  value: { fontSize: 13, fontWeight: '700', color: '#111827' },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
});
