import { useEffect, useRef, useState } from 'react';
import { firestore } from '@/services/firebase';
import { getMockArticulosForSkus, searchMockArticulos } from '../data/mock-skus';
import { type Articulo, docToArticulo } from '../services/articulos.mapper';
import { getLocalArticulosBySkus, searchLocalCatalog } from '../services/articulos-catalog';

export { type Articulo, docToArticulo } from '../services/articulos.mapper';

/** Búsqueda libre por prefijo de SKU o descripción (sin filtro de marca/categoría). */
export async function searchArticulosInFirestore(query: string): Promise<Articulo[]> {
  const q = query.trim().toUpperCase();
  if (q.length < 2) return [];

  const col = firestore().collection('articulos');
  const end = q + '';

  const bySkuSnap = await col
    .where('anulado', '!=', 1)
    .where('co_art', '>=', q)
    .where('co_art', '<=', end)
    .limit(20)
    .get();

  let byDescSnap: typeof bySkuSnap | null = null;
  if (bySkuSnap.docs.length < 5) {
    byDescSnap = await col
      .where('anulado', '!=', 1)
      .where('art_des', '>=', q)
      .where('art_des', '<=', end)
      .limit(20)
      .get();
  }

  const seen = new Set<string>();
  const merged: Articulo[] = [];

  for (const doc of bySkuSnap.docs) {
    const a = docToArticulo(doc.id, doc.data());
    if (!seen.has(a.sku)) {
      seen.add(a.sku);
      merged.push(a);
    }
  }
  if (byDescSnap) {
    for (const doc of byDescSnap.docs) {
      const a = docToArticulo(doc.id, doc.data());
      if (!seen.has(a.sku)) {
        seen.add(a.sku);
        merged.push(a);
      }
    }
  }

  return merged;
}

/** Completa con catálogo mock los SKUs que Firestore no devuelve. */
export function mergeArticulosWithMock(
  firestoreMap: Record<string, Articulo>,
  skus: string[],
): Record<string, Articulo> {
  const merged = { ...firestoreMap };
  const mockMap = getMockArticulosForSkus(skus);

  for (const sku of skus) {
    if (!merged[sku] && mockMap[sku]) {
      merged[sku] = mockMap[sku];
    }
  }

  return merged;
}

/** Mezcla resultados de Firestore con el catálogo mock local (sin duplicar SKUs). */
export function mergeSearchResultsWithMock(
  firestoreResults: Articulo[],
  query: string,
): Articulo[] {
  const mockResults = searchMockArticulos(query);
  const seen = new Set(firestoreResults.map((a) => a.sku));
  const merged = [...firestoreResults];

  for (const mock of mockResults) {
    if (seen.has(mock.sku)) continue;
    seen.add(mock.sku);
    merged.push(mock);
  }

  return merged;
}

/** Carga artículos del catálogo por lista de SKUs (líneas del pedido). */
export async function fetchArticulosBySkus(skus: string[]): Promise<Record<string, Articulo>> {
  const unique = [...new Set(skus.map((s) => s.trim()).filter(Boolean))];
  if (unique.length === 0) return {};

  try {
    const col = firestore().collection('articulos');
    const map: Record<string, Articulo> = {};

    for (let i = 0; i < unique.length; i += 10) {
      const chunk = unique.slice(i, i + 10);
      const snap = await col.where('co_art', 'in', chunk).get();
      for (const doc of snap.docs) {
        const data = doc.data();
        if (data.anulado === 1) continue;
        const articulo = docToArticulo(doc.id, data);
        map[articulo.sku] = articulo;
      }
    }

    // Sin red la consulta responde solo con lo cacheado: se completa con el
    // catálogo descargado antes de caer al mock.
    const missing = unique.filter((sku) => !map[sku]);
    if (missing.length > 0) {
      Object.assign(map, getLocalArticulosBySkus(missing));
    }

    return mergeArticulosWithMock(map, unique);
  } catch (err) {
    console.error('[fetchArticulosBySkus]', err);
    return mergeArticulosWithMock(getLocalArticulosBySkus(unique), unique);
  }
}

/**
 * Busca artículos en la colección `articulos` de Firestore.
 *
 * - Sin búsqueda (query vacío): devuelve lista vacía (el sheet mostrará las líneas del pedido).
 * - Con búsqueda: busca por prefijo en `co_art` (código SKU) y, si hay pocos resultados,
 *   también por prefijo en `art_des` (descripción).
 * - Excluye artículos con `anulado == 1`.
 */
export function useArticulosSearch(query: string, enabled = true) {
  const [results, setResults] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    const q = query.trim().toUpperCase();

    if (!enabled || q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    abortRef.current = false;

    // Debounce 300ms before hitting Firestore
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const fromFs = await searchArticulosInFirestore(q);
        // Sin red la query a `articulos` responde vacía (la caché de Firestore
        // solo tiene lo ya consultado): ahí entra el catálogo descargado.
        const base = fromFs.length > 0 ? fromFs : searchLocalCatalog(q);
        const merged = mergeSearchResultsWithMock(base, q);
        if (abortRef.current) return;
        setResults(merged);
      } catch (err) {
        console.error('[useArticulosSearch]', err);
        if (abortRef.current) return;
        setResults(mergeSearchResultsWithMock(searchLocalCatalog(q), q));
      } finally {
        if (!abortRef.current) setLoading(false);
      }
    }, 300);

    return () => {
      abortRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, enabled]);

  return { results, loading };
}
