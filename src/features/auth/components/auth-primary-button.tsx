import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowRight } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { useResolvedColorScheme } from '@/theme';

interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function AuthPrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: AuthPrimaryButtonProps) {
  const scheme = useResolvedColorScheme();
  const isDark = scheme === 'dark';

  const gradientColors = isDark
    ? (['#4A8BC4', '#2E5A85', '#1E4976'] as const)
    : (['#3B7CB8', '#2563A8', '#1E4976'] as const);

  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.wrapper,
        pressed && !disabled && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View className="absolute inset-0 rounded-2xl bg-white/10" pointerEvents="none" />
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View className="flex-row items-center justify-center gap-2.5">
            <Text className="text-[17px] font-semibold text-white tracking-wide">{label}</Text>
            <View className="h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    shadowColor: '#1E4976',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.65,
  },
  gradient: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
