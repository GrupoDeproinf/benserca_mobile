import * as Haptics from 'expo-haptics';
import { Check, Minus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

export type SelectionCheckState = boolean | 'mixed';

interface SelectionCheckProps {
  checked: SelectionCheckState;
  onToggle: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

export function SelectionCheck({
  checked,
  onToggle,
  accessibilityLabel,
  disabled = false,
}: SelectionCheckProps) {
  const filled = checked !== false;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onToggle();
      }}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [pressed && { opacity: 0.6 }]}
    >
      <View style={[styles.box, filled && styles.boxChecked, disabled && styles.boxDisabled]}>
        {checked === 'mixed' ? (
          <Minus size={16} color="#FFFFFF" strokeWidth={3} />
        ) : checked ? (
          <Check size={16} color="#FFFFFF" strokeWidth={3} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  boxDisabled: {
    opacity: 0.4,
  },
});
