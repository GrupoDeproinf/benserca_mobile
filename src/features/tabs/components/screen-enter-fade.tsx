import { useEffect, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const ENTER_MS = 280;
const OFFSET_Y = 10;

interface ScreenEnterFadeProps {
  children: ReactNode;
  /** Retardo antes del fade-in (ms). */
  delayMs?: number;
  style?: object;
}

/** Fade-in al montar pantalla (stack push, modales, etc.). */
export function ScreenEnterFade({ children, delayMs = 0, style }: ScreenEnterFadeProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: ENTER_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [delayMs, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * OFFSET_Y }],
  }));

  return (
    <Animated.View style={[styles.wrap, style, animatedStyle]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
});
