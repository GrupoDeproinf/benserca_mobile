import type { Order } from '@/features/picking/types';

export interface LoadingProgress {
  /** Bultos del pedido ya marcados como subidos al camión. */
  loaded: number;
  total: number;
  /** Números de los bultos que faltan por subir, en orden. */
  pendingNumbers: number[];
  /** Hay bultos y están todos en el camión: se puede despachar. */
  complete: boolean;
}

/**
 * Cuánto del pedido está en el camión. Se cuenta contra los bultos REALES del
 * pedido (`order.bultos`), no contra `loadedBundles` a secas: si la lista de
 * cargados trajera un número que ya no existe, no debe inflar el progreso.
 */
export function getLoadingProgress(order: Order): LoadingProgress {
  const loadedSet = new Set(order.loadedBundles);
  const pendingNumbers = order.bultos
    .map((b) => b.number)
    .filter((n) => !loadedSet.has(n))
    .sort((a, b) => a - b);
  const total = order.bultos.length;

  return {
    loaded: total - pendingNumbers.length,
    total,
    pendingNumbers,
    complete: total > 0 && pendingNumbers.length === 0,
  };
}
