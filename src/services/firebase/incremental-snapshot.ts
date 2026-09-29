import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Mapea los documentos de un `onSnapshot` re-procesando solo los que cambiaron.
 *
 * Firestore entrega en cada snapshot la lista completa, aunque haya cambiado un
 * solo documento. Mapear todo de nuevo (en `lo_orders` eso incluye reconstruir
 * los bultos desde `final_skus`) es trabajo tirado en cada cambio del almacén,
 * y además genera objetos nuevos para documentos idénticos. Aquí los que no
 * aparecen en `docChanges()` reutilizan el resultado anterior.
 *
 * `docChanges()` sin opciones excluye los cambios que son solo de metadata
 * (`fromCache`, `hasPendingWrites`), que no tocan los datos.
 *
 * Cada listener debe crear su propio mapper: la caché corresponde a UNA query.
 */
export function createIncrementalMapper<T>(
  map: (id: string, data: FirebaseFirestoreTypes.DocumentData) => T,
) {
  let cache = new Map<string, T>();

  return (snapshot: FirebaseFirestoreTypes.QuerySnapshot): T[] => {
    const changed = new Set(snapshot.docChanges().map((change) => change.doc.id));
    const next = new Map<string, T>();

    const items = snapshot.docs.map((doc) => {
      const cached = changed.has(doc.id) ? undefined : cache.get(doc.id);
      const item = cached !== undefined ? cached : map(doc.id, doc.data());
      next.set(doc.id, item);
      return item;
    });

    cache = next;
    return items;
  };
}
