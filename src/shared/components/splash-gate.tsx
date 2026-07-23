import * as SplashScreen from 'expo-splash-screen';
import { type ReactNode, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { BensercaLogo } from '@/shared/components/brand/benserca-logo';
import { colors, useResolvedColorScheme } from '@/theme';

const FADE_MS = 320;

/** Debe coincidir con `imageWidth` del plugin `expo-splash-screen` en `app.json`. */
const LOGO_SIZE = 200;

interface SplashGateProps {
  children: ReactNode;
}

/**
 * Réplica en JS del splash nativo que se superpone a la app hasta que la sesión
 * está hidratada, y luego se desvanece.
 *
 * El splash nativo se oculta de golpe (en Android `fade` no está soportado), así
 * que sin esta capa el salto al primer render es brusco. Al pintar exactamente
 * el mismo fondo y logo que `app.json`, ocultar el nativo no produce ningún
 * cambio visible y el fade queda a cargo de esta vista.
 */
export function SplashGate({ children }: SplashGateProps) {
  const scheme = useResolvedColorScheme();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [isVisible, setIsVisible] = useState(true);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!isHydrated) return;
    let cancelled = false;

    SplashScreen.hideAsync()
      .catch(() => null)
      .then(() => {
        if (cancelled) return;
        opacity.value = withTiming(
          0,
          { duration: FADE_MS, easing: Easing.out(Easing.quad) },
          (finished) => {
            if (finished) runOnJS(setIsVisible)(false);
          },
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isHydrated, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.root}>
      {children}
      {isVisible ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.overlay, { backgroundColor: colors[scheme].background }, animatedStyle]}
        >
          <BensercaLogo variant="icon" height={LOGO_SIZE} color={colors[scheme].foreground} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
