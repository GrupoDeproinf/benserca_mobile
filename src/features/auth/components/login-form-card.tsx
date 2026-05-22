import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useResolvedColorScheme } from '@/theme';

interface LoginFormCardProps extends PropsWithChildren {
  /** Ocupa el espacio entre marca y pie de pantalla */
  fill?: boolean;
}

export function LoginFormCard({ children, fill = false }: LoginFormCardProps) {
  const scheme = useResolvedColorScheme();
  const isDark = scheme === 'dark';
  const overlay = isDark ? 'rgba(17,24,39,0.5)' : 'rgba(255,255,255,0.62)';
  const borderColor = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.85)';

  return (
    <View style={[cardShadow, fill && styles.fill]}>
      <View style={[styles.border, { borderColor }, fill && styles.fill]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 40 : 28}
          tint={isDark ? 'dark' : 'light'}
          style={fill ? styles.fill : undefined}
        >
          <View style={[styles.inner, { backgroundColor: overlay }, fill && styles.innerFill]}>
            {children}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#0B1F33',
  shadowOffset: { width: 0, height: 16 },
  shadowOpacity: 0.22,
  shadowRadius: 32,
  elevation: 12,
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  border: {
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  inner: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 20,
  },
  innerFill: {
    flex: 1,
    flexDirection: 'column',
  },
});
