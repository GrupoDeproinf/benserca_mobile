import { useEffect, useRef, useState } from 'react';
import { firestore } from '@/services/firebase';
import { filterSubstituteSkus, MOCK_SKU_CATALOG } from '../data/mock-skus';
import type { OrderLine } from '../types';
import type { Articulo } from './use-articulos-search';
import { docToArticulo, searchArticulosInFirestore } from './use-articulos-search';

function matchesSearch(item: Articulo, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
}

/**
 * Candidato válido de sustitución:
 *  - Gate: el original debe tener `talla` (se valida antes de llamar aquí).
 *  - Filtro: mismo `co_cat` y mismo `co_subl` que el original. La talla NO filtra.
 */
function isSubstituteCandidate(item: Articulo, original: OrderLine): boolean {
  return (
    item.sku !== original.sku &&
    item.coCat === original.coCat &&
    item.coSubl === original.coSubl
  );
}

function filterByCategoria(items: Articulo[], original: OrderLine): Articulo[] {
  if (!original.talla) return [];
  return items.filter((item) => isSubstituteCandidate(item, original));
}

function mockToArticulo(item: (typeof MOCK_SKU_CATALOG)[number]): Articulo {
  return {
    sku: item.sku,
    name: item.name,
    talla: item.talla,
    coCat: item.coCat,
    coSubl: item.coSubl,
    category: item.category,
    brand: item.brand,
    family: item.family,
  };
}

function mockRelated(original: OrderLine): Articulo[] {
  return filterSubstituteSkus(MOCK_SKU_CATALOG, original).map(mockToArticulo);
}

/** Búsqueda global también restringida a co_cat + co_subl del original. */
function mockSearchAll(query: string, original: OrderLine): Articulo[] {
  if (!original.talla) return [];
  const q = query.trim().toLowerCase();
  return MOCK_SKU_CATALOG.map(mockToArticulo)
    .filter((item) => isSubstituteCandidate(item, original) && matchesSearch(item, q));
}

async function fetchRelatedArticulos(original: OrderLine): Promise<Articulo[]> {
  // Gate: sin talla no hay sustitución posible.
  if (!original.talla) return [];

  const col = firestore().collection('articulos');
  // co_cat / co_subl se comparan con el valor crudo (con espacios finales) tal
  // como viene de Profit. Puede requerir un índice compuesto en Firestore.
  let query = col.where('anulado', '!=', 1);
  if (original.coCat) query = query.where('co_cat', '==', original.coCat);
  if (original.coSubl) query = query.where('co_subl', '==', original.coSubl);

  const snap = await query.limit(40).get();
  const fetched = snap.docs.map((doc) => docToArticulo(doc.id, doc.data()));
  const related = filterByCategoria(fetched, original);
  return related.length > 0 ? related : mockRelated(original);
}

/**
 * Sin búsqueda: artículos de la misma categoría (co_cat + co_subl) del original.
 * Con búsqueda (≥2 chars): también dentro de la misma categoría.
 * Si el original no tiene talla, no hay candidatos (no es sustituible).
 */
export function useSubstituteArticulos(
  originalLine: OrderLine | null,
  search: string,
  enabled = true,
) {
  const [results, setResults] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!enabled || !originalLine?.talla) {
      setResults([]);
      setLoading(false);
      setIsGlobalSearch(false);
      return;
    }

    const q = search.trim();
    const globalMode = q.length >= 2;
    setIsGlobalSearch(globalMode);
    setLoading(true);
    abortRef.current = false;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        if (globalMode) {
          let items = await searchArticulosInFirestore(q);
          // Solo candidatos de la misma categoría (co_cat + co_subl) del original.
          items = items.filter((item) => isSubstituteCandidate(item, originalLine));
          if (items.length === 0) {
            items = mockSearchAll(q, originalLine);
          }
          if (!abortRef.current) setResults(items);
          return;
        }

        const related = await fetchRelatedArticulos(originalLine);
        if (!abortRef.current) setResults(related);
      } catch (err) {
        console.error('[useSubstituteArticulos]', err);
        if (!abortRef.current) {
          setResults(
            globalMode ? mockSearchAll(q, originalLine) : mockRelated(originalLine),
          );
        }
      } finally {
        if (!abortRef.current) setLoading(false);
      }
    }, 250);

    return () => {
      abortRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [originalLine, search, enabled]);

  return { results, loading, isGlobalSearch };
}
