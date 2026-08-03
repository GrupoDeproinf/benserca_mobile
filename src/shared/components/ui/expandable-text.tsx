import { useState } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Text } from './text';

interface ExpandableTextProps {
  children: string;
  /** Líneas visibles mientras está colapsado. */
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Nombre de artículo que se corta con "..." y se despliega completo al tocarlo
 * (y se vuelve a colapsar con otro toque).
 *
 * Usa el `onPress` del propio Text en vez de envolverlo en un Pressable: así no
 * agrega un nodo al árbol y el layout de las filas donde se usa queda idéntico.
 * Ojo al colocarlo dentro de una fila pulsable: el toque sobre el texto lo
 * captura este componente y ya no llega al padre.
 */
export function ExpandableText({ children, numberOfLines = 2, style }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Text
      style={style}
      numberOfLines={expanded ? undefined : numberOfLines}
      onPress={() => setExpanded((v) => !v)}
      suppressHighlighting
    >
      {children}
    </Text>
  );
}
