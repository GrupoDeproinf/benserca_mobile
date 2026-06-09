import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type OrderActionVariant = 'primary' | 'secondary';

interface OrderActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: OrderActionVariant;
  icon?: LucideIcon;
  disabled?: boolean;
}

export function OrderActionButton({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled = false,
}: OrderActionButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: isPrimary ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)' }}
      style={({ pressed }) => [
        styles.pressable,
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.88 },
      ]}
    >
      <View
        style={[styles.surface, isPrimary ? styles.primarySurface : styles.secondarySurface]}
        collapsable={false}
      >
        {Icon ? (
          <Icon size={20} color={isPrimary ? '#FFFFFF' : '#111827'} strokeWidth={2.2} />
        ) : null}
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primarySurface: {
    backgroundColor: '#000000',
  },
  secondarySurface: {
    backgroundColor: '#E9E9EB',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelPrimary: {
    color: '#FFFFFF',
  },
  labelSecondary: {
    color: '#111827',
  },
});
