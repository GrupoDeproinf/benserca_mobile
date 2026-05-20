import { Platform, View, type ViewProps } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { useResolvedColorScheme } from '@/theme';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'clear' | 'regular';
  className?: string;
}

/**
 * Reusable glass-effect surface.
 *
 * - On iOS 26+ uses native Liquid Glass via `expo-glass-effect`.
 * - On older iOS / Android falls back to `expo-blur` BlurView.
 */
export function GlassCard({
  intensity = 50,
  tint = 'regular',
  className = '',
  children,
  style,
  ...rest
}: GlassCardProps) {
  const scheme = useResolvedColorScheme();

  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return (
      <GlassView
        glassEffectStyle={tint}
        style={[{ borderRadius: 24, overflow: 'hidden' }, style]}
        {...rest}
      >
        <View className={className}>{children}</View>
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={scheme === 'dark' ? 'dark' : 'light'}
      style={[{ borderRadius: 24, overflow: 'hidden' }, style]}
    >
      <View className={className} {...rest}>
        {children}
      </View>
    </BlurView>
  );
}
