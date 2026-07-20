import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type OrderActionVariant = 'primary' | 'secondary';
export type OrderActionSize = 'default' | 'compact';

interface OrderActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: OrderActionVariant;
  size?: OrderActionSize;
  icon?: LucideIcon;
  disabled?: boolean;
}

export function OrderActionButton({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  icon: Icon,
  disabled = false,
}: OrderActionButtonProps) {
  const isPrimary = variant === 'primary';
  const isCompact = size === 'compact';

  const iconColor = disabled
    ? '#9CA3AF'
    : isPrimary
      ? '#FFFFFF'
      : '#111827';
  const labelColor = disabled
    ? '#9CA3AF'
    : isPrimary
      ? '#FFFFFF'
      : '#111827';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={
        disabled
          ? undefined
          : { color: isPrimary ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)' }
      }
      style={({ pressed }) => [
        styles.pressable,
        pressed && !disabled && { opacity: 0.88 },
      ]}
    >
      <View
        style={[
          styles.surface,
          isCompact && styles.surfaceCompact,
          isPrimary ? styles.primarySurface : styles.secondarySurface,
          disabled && styles.surfaceDisabled,
        ]}
        collapsable={false}
      >
        {Icon ? (
          <Icon size={isCompact ? 16 : 20} color={iconColor} strokeWidth={2.2} />
        ) : null}
        <Text
          style={[
            styles.label,
            isCompact && styles.labelCompact,
            { color: labelColor },
          ]}
        >
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
  surfaceCompact: {
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primarySurface: {
    backgroundColor: '#000000',
  },
  secondarySurface: {
    backgroundColor: '#E9E9EB',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  surfaceDisabled: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelCompact: {
    fontSize: 13,
  },
});
