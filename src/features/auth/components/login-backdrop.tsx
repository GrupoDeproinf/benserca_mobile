import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useResolvedColorScheme } from '@/theme';
import { colors } from '@/theme/tokens';

export function LoginBackdrop() {
  const scheme = useResolvedColorScheme();
  const palette = colors[scheme];
  const isDark = scheme === 'dark';

  // Azul arriba (marca) → transición suave → fondo claro abajo
  const gradientColors = isDark
    ? (['#3D7AB5', '#1E4976', '#243B55', palette.background] as const)
    : (['#4A8BC4', '#1E4976', '#A8C8E0', palette.background] as const);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.34, 0.58, 0.88]}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute -right-28 top-12 h-72 w-72 rounded-full bg-white/10" />
      <View className="absolute -left-20 top-32 h-52 w-52 rounded-full bg-white/6" />
    </View>
  );
}
