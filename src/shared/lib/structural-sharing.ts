import { replaceEqualDeep } from '@tanstack/react-query';

/**
 * Reutiliza las referencias de `prev` para todo lo que no cambió en `next`.
 *
 * Los listeners de Firestore reemiten la lista completa en cada cambio, y cada
 * vez se mapeaba a objetos nuevos aunque el contenido fuera idéntico. Para
 * React eso es "todo cambió": cada pantalla suscrita al store re-renderizaba la
 * lista entera — y el React Compiler no podía saltarse nada, porque sus memos
 * comparan por referencia. Un pedido que otro picker tocó en el almacén bastaba
 * para redibujar todas las tarjetas.
 *
 * Con esto, lo que no cambió conserva su referencia (también por dentro: un
 * pedido con un bulto nuevo mantiene sus `lines`), y si no cambió nada se
 * devuelve `prev` tal cual para que el store pueda no notificar.
 *
 * El emparejamiento es por clave, no por posición: si la lista se reordena, cada
 * elemento se compara contra su propia versión anterior.
 */
export function shareByKey<T>(prev: T[], next: T[], keyOf: (item: T) => string): T[] {
  const prevByKey = new Map(prev.map((item) => [keyOf(item), item]));
  let unchanged = prev.length === next.length;

  const shared = next.map((item, index) => {
    const previous = prevByKey.get(keyOf(item));
    const value = previous === undefined ? item : replaceEqualDeep(previous, item);
    if (unchanged && value !== prev[index]) unchanged = false;
    return value;
  });

  return unchanged ? prev : shared;
}
