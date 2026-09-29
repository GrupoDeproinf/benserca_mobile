import { RefreshCw } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

interface RefreshIconButtonProps {
  onPress: () => void;
  /** Deshabilita y atenúa el botón mientras corre el refresh; anima el ícono girando. */
  refreshing?: boolean;
  accessibilityLabel?: string;
}

/** Botón cuadrado de refresh, misma estética que el de la barra de búsqueda/filtro. */
export function RefreshIconButton({
  onPress,
  refreshing = false,
  accessibilityLabel,
}: RefreshIconButtonProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!refreshing) return;

    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [refreshing, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Pressable
      onPress={onPress}
      disabled={refreshing}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.pressable, (pressed || refreshing) && { opacity: 0.6 }]}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
    >
      <View style={styles.btn} collapsable={false}>
        <Animated.View style={refreshing ? { transform: [{ rotate }] } : undefined}>
          <RefreshCw size={16} color="#3C3C43" strokeWidth={2} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
});
