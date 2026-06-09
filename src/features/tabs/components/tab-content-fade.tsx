import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const ENTER_MS = 260;
const OFFSET_Y = 6;

interface TabContentFadeProps {
  children: ReactNode;
}

/** Entrada suave solo la primera vez; al volver del stack no parpadea. */
export function TabContentFade({ children }: TabContentFadeProps) {
  const isFocused = useIsFocused();
  const hasAnimatedOnce = useRef(false);
  const progress = useSharedValue(1);

  useEffect(() => {
    if (!isFocused) return;

    if (!hasAnimatedOnce.current) {
      hasAnimatedOnce.current = true;
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: ENTER_MS,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    progress.value = 1;
  }, [isFocused, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * OFFSET_Y }],
  }));

  return (
    <Animated.View style={[styles.wrap, animatedStyle]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});
