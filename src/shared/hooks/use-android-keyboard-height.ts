import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Alto del teclado en Android, en vivo. Solo para Android: en iOS el push del
 * contenido ya lo resuelve `KeyboardAvoidingView` (`behavior="padding"`).
 *
 * En Android, ese mismo `KeyboardAvoidingView` dentro de un `Modal`
 * (`statusBarTranslucent`) entra en un loop de temblor: pelea con el resize
 * nativo de la Activity (`android:windowSoftInputMode="adjustResize"`), que
 * el `Modal` no hereda de forma consistente. La solución es desactivarlo en
 * Android (`enabled={Platform.OS === 'ios'}`) y compensar a mano con este
 * alto como `paddingBottom` del contenedor — un solo ajuste por evento, sin
 * pelearse con nada.
 */
export function useAndroidKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
