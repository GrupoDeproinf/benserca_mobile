import { createContext, useContext, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

export const OrderDetailTransitionProgressContext =
  createContext<SharedValue<number> | null>(null);

export function useOrderDetailTransitionProgress() {
  return useContext(OrderDetailTransitionProgressContext);
}

interface OrderDetailBodyFadeProps {
  children: ReactNode;
  style?: object;
}

/** Fade del cuerpo sincronizado con la expansión del header al entrar. */
export function OrderDetailBodyFade({ children, style }: OrderDetailBodyFadeProps) {
  const progress = useOrderDetailTransitionProgress();

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress?.value ?? 1;
    return {
      opacity: interpolate(p, [0.52, 0.94], [0, 1], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(p, [0.52, 0.94], [8, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.wrap, style, animatedStyle]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
});
