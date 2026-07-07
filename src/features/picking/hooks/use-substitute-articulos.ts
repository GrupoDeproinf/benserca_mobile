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

function filterByTaxonomy(items: Articulo[], original: OrderLine): Articulo[] {
  return items.filter((item) => {
    if (item.sku === original.sku) return false;
    if (original.brand && item.brand && item.brand !== original.brand) return false;
    if (original.category && item.category && item.category !== original.category) return false;
    if (original.family && item.family && item.family !== original.family) return false;
    return true;
  });
}

function mockToArticulo(item: (typeof MOCK_SKU_CATALOG)[number]): Articulo {
  return {
    sku: item.sku,
    name: item.name,
    unitsPerBundle: item.unitsPerBundle,
    category: item.category,
    brand: item.brand,
    family: item.family,
  };
}

function mockRelated(original: OrderLine): Articulo[] {
  return filterSubstituteSkus(MOCK_SKU_CATALOG, original).map(mockToArticulo);
}

function mockSearchAll(query: string, excludeSku: string): Articulo[] {
  const q = query.trim().toLowerCase();
  return MOCK_SKU_CATALOG.filter(
    (item) => item.sku !== excludeSku && matchesSearch(mockToArticulo(item), q),
  ).map(mockToArticulo);
}

async function fetchRelatedArticulos(original: OrderLine): Promise<Articulo[]> {
  if (!original.brand && !original.category) {
    return mockRelated(original);
  }

  const col = firestore().collection('articulos');
  let query = col.where('anulado', '!=', 1);

  if (original.brand) {
    query = query.where('brand', '==', original.brand);
  }
  if (original.category) {
    query = query.where('category', '==', original.category);
  }

  const snap = await query.limit(40).get();
  const fetched = snap.docs.map((doc) => docToArticulo(doc.id, doc.data()));
  const related = filterByTaxonomy(fetched, original);
  return related.length > 0 ? related : mockRelated(original);
}

/**
 * Sin búsqueda: artículos relacionados por marca/categoría.
 * Con búsqueda (≥2 chars): cualquier artículo del catálogo, sin restricción de taxonomía.
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
    if (!enabled || !originalLine) {
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
          items = items.filter((item) => item.sku !== originalLine.sku);
          if (items.length === 0) {
            items = mockSearchAll(q, originalLine.sku);
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
            globalMode ? mockSearchAll(q, originalLine.sku) : mockRelated(originalLine),
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
