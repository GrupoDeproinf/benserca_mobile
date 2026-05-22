import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { BrandMark } from './brand-mark';
import { useResolvedColorScheme } from '@/theme';

interface LoginHeroProps {
  height: number;
  style?: ViewStyle;
}

export function LoginHero({ height, style }: LoginHeroProps) {
  const scheme = useResolvedColorScheme();
  const isDark = scheme === 'dark';

  const gradientColors = isDark
    ? (['#1E4976', '#183A5C', '#0F2438'] as const)
    : (['#3B6F9E', '#1E4976', '#163D63'] as const);

  return (
    <View style={[{ height }, style]} className="overflow-hidden">
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      <View
        className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-white/10"
        pointerEvents="none"
      />
      <View
        className="absolute -left-16 bottom-8 h-44 w-44 rounded-full bg-white/5"
        pointerEvents="none"
      />
      <View
        className="absolute right-8 bottom-12 h-20 w-20 rounded-full bg-white/8"
        pointerEvents="none"
      />

      <View className="flex-1 items-center justify-center px-6 pb-6">
        <BrandMark size="lg" showTagline tone="onDark" />
      </View>
    </View>
  );
}
