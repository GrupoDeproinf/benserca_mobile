import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  disabled = false,
}: QtyStepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;

  const decrement = () => {
    if (disabled || atMin) return;
    Haptics.selectionAsync();
    onChange(value - 1);
  };

  const increment = () => {
    if (disabled || atMax) return;
    Haptics.selectionAsync();
    onChange(value + 1);
  };

  return (
    <View style={styles.root}>
      <Pressable
        onPress={decrement}
        disabled={disabled || atMin}
        hitSlop={6}
        style={({ pressed }) => [
          styles.btn,
          (disabled || atMin) && styles.btnDisabled,
          pressed && !disabled && !atMin && styles.btnPressed,
        ]}
      >
        <Minus size={16} color="#111827" strokeWidth={2.5} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        onPress={increment}
        disabled={disabled || atMax}
        hitSlop={6}
        style={({ pressed }) => [
          styles.btn,
          (disabled || atMax) && styles.btnDisabled,
          pressed && !disabled && !atMax && styles.btnPressed,
        ]}
      >
        <Plus size={16} color="#111827" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E9E9EB',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnPressed: {
    opacity: 0.85,
  },
  value: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
});
