import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/shared/components/ui/text';

interface CircularProgressProps {
  /** 0-1 */
  progress: number;
  size?: number;
  color?: string;
}

export function CircularProgress({ progress, size = 44, color = '#10B981' }: CircularProgressProps) {
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));
  const cx = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={String(circumference)}
          strokeDashoffset={String(offset)}
          strokeLinecap="round"
          transform={`rotate(-90, ${cx}, ${cx})`}
        />
      </Svg>
      <Text style={{ fontSize: 9, fontWeight: '800', color: '#111827' }}>
        {Math.round(progress * 100)}%
      </Text>
    </View>
  );
}
