import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type BultoActionVariant = 'filled' | 'outline';

interface BultoActionButtonProps {
  label: string;
  onPress: () => void;
  icon: LucideIcon;
  variant?: BultoActionVariant;
}

export function BultoActionButton({
  label,
  onPress,
  icon: Icon,
  variant = 'outline',
}: BultoActionButtonProps) {
  const filled = variant === 'filled';

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: filled ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)' }}
      style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.88 }]}
    >
      <View
        style={[styles.surface, filled ? styles.filledSurface : styles.outlineSurface]}
        collapsable={false}
      >
        <Icon size={18} color={filled ? '#FFFFFF' : '#111827'} strokeWidth={2} />
        <Text
          style={[styles.label, filled ? styles.labelFilled : styles.labelOutline]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },
  filledSurface: {
    backgroundColor: '#000000',
  },
  outlineSurface: {
    backgroundColor: '#E9E9EB',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelFilled: {
    color: '#FFFFFF',
  },
  labelOutline: {
    color: '#111827',
  },
});
