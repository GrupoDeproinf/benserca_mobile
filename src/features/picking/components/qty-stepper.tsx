import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'default' | 'medium' | 'large';
  /** Permite escribir la cantidad directamente (teclado numérico). */
  editable?: boolean;
  /** Se dispara al intentar subir por encima del máximo. */
  onAtMax?: () => void;
}

export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  disabled = false,
  size = 'default',
  editable = false,
  onAtMax,
}: QtyStepperProps) {
  const isMedium = size === 'medium';
  const isLarge = size === 'large';
  const isCompact = !isMedium && !isLarge;
  const atMin = value <= min;
  const atMax = value >= max;

  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const decrement = () => {
    if (disabled || atMin) return;
    Haptics.selectionAsync();
    onChange(value - 1);
  };

  const increment = () => {
    if (disabled) return;
    if (atMax) {
      onAtMax?.();
      return;
    }
    Haptics.selectionAsync();
    onChange(value + 1);
  };

  const handleTextChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length === 0) {
      onChange(min);
      return;
    }
    const parsed = parseInt(digits, 10);
    if (parsed > max) {
      onAtMax?.();
      onChange(max);
      return;
    }
    onChange(clamp(parsed));
  };

  return (
    <View style={[styles.root, isMedium && styles.rootMedium, isLarge && styles.rootLarge]}>
      <Pressable
        onPress={decrement}
        disabled={disabled || atMin}
        hitSlop={isCompact ? 6 : 8}
        style={({ pressed }) => [
          styles.btn,
          isMedium && styles.btnMedium,
          isLarge && styles.btnLarge,
          (disabled || atMin) && styles.btnDisabled,
          pressed && !disabled && !atMin && styles.btnPressed,
        ]}
      >
        <Minus
          size={isLarge ? 22 : isMedium ? 20 : 16}
          color="#111827"
          strokeWidth={2.5}
        />
      </Pressable>

      {editable ? (
        <TextInput
          value={String(value)}
          onChangeText={handleTextChange}
          keyboardType="number-pad"
          editable={!disabled}
          selectTextOnFocus
          style={[
            styles.valueInput,
            isMedium && styles.valueInputMedium,
            isLarge && styles.valueInputLarge,
          ]}
          maxLength={4}
        />
      ) : (
        <Text style={[styles.value, isMedium && styles.valueMedium, isLarge && styles.valueLarge]}>
          {value}
        </Text>
      )}

      <Pressable
        onPress={increment}
        disabled={disabled}
        hitSlop={isCompact ? 6 : 8}
        style={({ pressed }) => [
          styles.btn,
          isMedium && styles.btnMedium,
          isLarge && styles.btnLarge,
          disabled && styles.btnDisabled,
          !disabled && atMax && styles.btnAtLimit,
          pressed && !disabled && styles.btnPressed,
        ]}
      >
        <Plus
          size={isLarge ? 22 : isMedium ? 20 : 16}
          color="#111827"
          strokeWidth={2.5}
        />
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
  rootMedium: {
    gap: 10,
    justifyContent: 'center',
  },
  rootLarge: {
    gap: 12,
    justifyContent: 'center',
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
  btnMedium: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D1D6',
  },
  btnLarge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D1D6',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnAtLimit: {
    opacity: 0.55,
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
  valueMedium: {
    minWidth: 48,
    fontSize: 20,
  },
  valueLarge: {
    minWidth: 56,
    fontSize: 22,
  },
  valueInput: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  valueInputMedium: {
    minWidth: 60,
    fontSize: 20,
    fontWeight: '800',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  valueInputLarge: {
    minWidth: 72,
    fontSize: 24,
    fontWeight: '800',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});
