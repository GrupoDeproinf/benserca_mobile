import { useEffect, useRef, useState } from 'react';
import { firestore } from '@/services/firebase';
import {
  getMockArticulosForSkus,
  searchMockArticulos,
} from '../data/mock-skus';

export interface Articulo {
  sku: string;
  name: string;
  unitsPerBundle: number;
  category?: string;
  brand?: string;
  family?: string;
}

// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
export function docToArticulo(id: string, data: Record<string, any>): Articulo {
  return {
    sku: (data.co_art as string | undefined)?.trim() ?? id,
    name: (data.art_des as string | undefined)?.trim() ?? '',
    unitsPerBundle: (data.units_per_bundle as number | undefined) ?? 0,
    category:
      (data.category as string | undefined) ??
      (data.cat_des as string | undefined) ??
      undefined,
    brand:
      (data.brand as string | undefined) ??
      (data.marca as string | undefined) ??
      undefined,
    family:
      (data.family as string | undefined) ??
      (data.familia as string | undefined) ??
      undefined,
  };
}

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

/** Completa o sustituye con catálogo mock cuando Firestore no trae `units_per_bundle`. */
export function mergeArticulosWithMock(
  firestoreMap: Record<string, Articulo>,
  skus: string[],
): Record<string, Articulo> {
  const merged = { ...firestoreMap };
  const mockMap = getMockArticulosForSkus(skus);

  for (const sku of skus) {
    const fromFs = merged[sku];
    const fromMock = mockMap[sku];
    if (!fromMock) continue;

    if (!fromFs || fromFs.unitsPerBundle <= 0) {
      merged[sku] = fromMock;
      continue;
    }

    // En desarrollo: permitir probar capacidad real si Firestore trae 1 por defecto
    if (__DEV__ && fromFs.unitsPerBundle <= 1 && fromMock.unitsPerBundle > 1) {
      merged[sku] = { ...fromFs, unitsPerBundle: fromMock.unitsPerBundle };
    }
  }

  return merged;
}

/** Mezcla resultados de Firestore con el catálogo mock local. */
export function mergeSearchResultsWithMock(
  firestoreResults: Articulo[],
  query: string,
): Articulo[] {
  const mockResults = searchMockArticulos(query);
  const seen = new Set(firestoreResults.map((a) => a.sku));
  const merged = [...firestoreResults];

  for (const mock of mockResults) {
    if (seen.has(mock.sku)) {
      const idx = merged.findIndex((a) => a.sku === mock.sku);
      const existing = merged[idx];
      if (
        existing &&
        (existing.unitsPerBundle <= 0 ||
          (__DEV__ && existing.unitsPerBundle <= 1 && mock.unitsPerBundle > 1))
      ) {
        merged[idx] = { ...existing, unitsPerBundle: mock.unitsPerBundle };
      }
      continue;
    }
    seen.add(mock.sku);
    merged.push(mock);
  }

  return merged;
}

/** Carga artículos del catálogo por lista de SKUs (líneas del pedido). */
export async function fetchArticulosBySkus(
  skus: string[],
): Promise<Record<string, Articulo>> {
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

    return mergeArticulosWithMock(map, unique);
  } catch (err) {
    console.error('[fetchArticulosBySkus]', err);
    return getMockArticulosForSkus(unique);
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
        const merged = mergeSearchResultsWithMock(fromFs, q);
        if (abortRef.current) return;
        setResults(merged);
      } catch (err) {
        console.error('[useArticulosSearch]', err);
        if (!abortRef.current) setResults(searchMockArticulos(q));
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
