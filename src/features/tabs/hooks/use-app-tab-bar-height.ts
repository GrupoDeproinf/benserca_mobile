import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR } from '../constants/tab-bar';

/**
 * Espacio total que ocupa el tab bar flotante: altura + margen inferior + safe area inferior.
 * Útil para añadir `paddingBottom` en listas y evitar que el contenido quede tapado.
 */
export function useAppTabBarHeight() {
  const insets = useSafeAreaInsets();
  return TAB_BAR.height + TAB_BAR.marginBottom + Math.max(insets.bottom, 8);
}
