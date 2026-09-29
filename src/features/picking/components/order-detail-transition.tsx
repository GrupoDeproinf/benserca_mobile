import { createContext, type ReactNode, useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

export const OrderDetailTransitionProgressContext = createContext<SharedValue<number> | null>(null);

export function useOrderDetailTransitionProgress() {
  return useContext(OrderDetailTransitionProgressContext);
}

interface OrderDetailBodyFadeProps {
  children: ReactNode;
  style?: object;
}

/**
 * Contenedor del cuerpo del detalle. Antes era un `Animated.View` de Reanimated
 * que hacía un fade de entrada sincronizado con el header.
 *
 * Se quitó la animación porque envolvía TODO el cuerpo —los renglones del
 * pedido y todos los bultos— y en la arquitectura nueva eso filtra memoria: un
 * `Animated.View` de Reanimated retiene los shadow nodes de su subárbol
 * completo con un `shared_ptr` vía `jsi::NativeState`. Esa memoria vive en la
 * capa C++ de Fabric, fuera del heap de Hermes, así que el GC no la ve y no se
 * libera al desmontar la pantalla (ni con `trim-memory`).
 *
 * Medido en una tablet con un pedido de 250 renglones, abriendo y cerrando el
 * detalle: 20 MB perdidos por apertura con el `Animated.View`, 0,7 MB sin él
 * — y sin él la memoria se estabiliza en vez de crecer sin techo.
 *
 * El header sigue animando su entrada: sus `Animated.View` envuelven un
 * subárbol chico y acotado, que es el uso que sí sale barato.
 */
export function OrderDetailBodyFade({ children, style }: OrderDetailBodyFadeProps) {
  return <View style={[styles.wrap, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
});
