import { useEffect, useState } from 'react';
import { getMockArticuloBySku, getMockArticulosForSkus } from '../data/mock-skus';
import type { OrderLine } from '../types';
import { type Articulo, fetchArticulosBySkus } from './use-articulos-search';

/** Enriquece líneas del pedido con `units_per_bundle` (Firestore + fallback mock). */
export function useOrderLineArticulos(lines: OrderLine[], enabled = true) {
  const [bySku, setBySku] = useState<Record<string, Articulo>>({});

  useEffect(() => {
    if (!enabled || lines.length === 0) {
      setBySku({});
      return;
    }

    let cancelled = false;
    const skus = lines.map((l) => l.sku);

    fetchArticulosBySkus(skus)
      .then((map) => {
        if (!cancelled) setBySku(map);
      })
      .catch((err) => {
        console.error('[useOrderLineArticulos]', err);
        if (!cancelled) setBySku(getMockArticulosForSkus(skus));
      });

    return () => {
      cancelled = true;
    };
  }, [lines, enabled]);

  return bySku;
}

/**
 * Resuelve `units_per_bundle` de forma consistente en toda la app.
 *
 * Prioridad: catálogo de artículos (la "lista de artículos", fuente maestra) →
 * valor de la línea del pedido → catálogo mock → 1.
 *
 * Así, el valor mostrado y el usado para el cálculo de capacidad SIEMPRE
 * coinciden con lo que aparece en la lista de artículos.
 */
export function resolveEffectiveUnitsPerBundle(
  lineUnitsPerBundle: number,
  catalogUnitsPerBundle?: number,
  sku?: string,
): number {
  if (catalogUnitsPerBundle != null && catalogUnitsPerBundle > 0) {
    return catalogUnitsPerBundle;
  }
  if (lineUnitsPerBundle > 0) return lineUnitsPerBundle;

  const mock = sku ? getMockArticuloBySku(sku) : undefined;
  if (mock && mock.unitsPerBundle > 0) return mock.unitsPerBundle;

  return 1;
}
