import { useEffect, useRef, useState } from 'react';
import { firestore } from '@/services/firebase';

export interface Articulo {
  sku: string;
  name: string;
  unitsPerBundle: number;
}

// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function docToArticulo(id: string, data: Record<string, any>): Articulo {
  return {
    sku: (data.co_art as string | undefined)?.trim() ?? id,
    name: (data.art_des as string | undefined)?.trim() ?? '',
    unitsPerBundle: (data.units_per_bundle as number | undefined) ?? 1,
  };
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
        const col = firestore().collection('articulos');
        const end = q + '';

        // Primary: search by SKU code (co_art)
        const bySkuSnap = await col
          .where('anulado', '!=', 1)
          .where('co_art', '>=', q)
          .where('co_art', '<=', end)
          .limit(20)
          .get();

        // Secondary: search by description (art_des) if SKU search has few results
        let byDescSnap: typeof bySkuSnap | null = null;
        if (bySkuSnap.docs.length < 5) {
          byDescSnap = await col
            .where('anulado', '!=', 1)
            .where('art_des', '>=', q)
            .where('art_des', '<=', end)
            .limit(20)
            .get();
        }

        if (abortRef.current) return;

        const seen = new Set<string>();
        const merged: Articulo[] = [];

        for (const doc of bySkuSnap.docs) {
          const a = docToArticulo(doc.id, doc.data());
          if (!seen.has(a.sku)) { seen.add(a.sku); merged.push(a); }
        }
        if (byDescSnap) {
          for (const doc of byDescSnap.docs) {
            const a = docToArticulo(doc.id, doc.data());
            if (!seen.has(a.sku)) { seen.add(a.sku); merged.push(a); }
          }
        }

        setResults(merged);
      } catch (err) {
        console.error('[useArticulosSearch]', err);
        setResults([]);
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
