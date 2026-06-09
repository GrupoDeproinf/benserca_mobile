import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './text';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 9999,
  disabled = false,
  className = '',
}: StepperProps) {
  const theme = useTheme();

  const decrement = () => {
    if (disabled || value <= min) return;
    Haptics.selectionAsync();
    onChange(value - 1);
  };

  const increment = () => {
    if (disabled || value >= max) return;
    Haptics.selectionAsync();
    onChange(value + 1);
  };

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View className={`flex-row items-center gap-3 ${className}`}>
      <Pressable
        onPress={decrement}
        disabled={disabled || atMin}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        className="h-10 w-10 items-center justify-center rounded-lg border border-border bg-card active:opacity-70"
        style={{ opacity: disabled || atMin ? 0.4 : 1 }}
      >
        <Minus size={18} color={theme.foreground} />
      </Pressable>
      <Text className="min-w-[2.5rem] text-center text-lg font-semibold">{value}</Text>
      <Pressable
        onPress={increment}
        disabled={disabled || atMax}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        className="h-10 w-10 items-center justify-center rounded-lg border border-border bg-card active:opacity-70"
        style={{ opacity: disabled || atMax ? 0.4 : 1 }}
      >
        <Plus size={18} color={theme.foreground} />
      </Pressable>
    </View>
  );
}
