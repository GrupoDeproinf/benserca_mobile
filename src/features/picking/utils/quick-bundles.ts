import type { Order } from '../types';
import { getActiveOrderLines } from './bulto-capacity';
import { getAssignedQtyForLine } from './order-snapshot';

/**
 * Renglón que Profit marca con `units_per_bundle`: se puede armar de un toque,
 * creando un bulto ya cerrado con esa cantidad exacta.
 *
 * Es una tarjeta por RENGLÓN, no por artículo. Cuando Profit repite el mismo SKU
 * (el "20 + 2"), esos renglones son cantidades independientes —máximo 20 y
 * máximo 2, nunca 22— así que cada uno tiene su tarjeta, su pendiente y sus
 * propios ítems dentro de los bultos.
 */
export interface QuickBundleCandidate {
  lineId: string;
  sku: string;
  name: string;
  /** Cantidad con la que se arma cada bulto rápido. */
  unitsPerBundle: number;
  /** Lo pedido en ESE renglón. Distingue las tarjetas cuando el SKU se repite. */
  requiredQty: number;
  /** Cuánto falta de ese renglón por meter en bultos. */
  pending: number;
  /**
   * Cuántos bultos COMPLETOS caben en lo pendiente del renglón. Siempre >= 1:
   * un renglón que no da ni para uno no genera tarjeta.
   */
  availableBundles: number;
  /** Unidades que se van a empaquetar al armar (`availableBundles * unitsPerBundle`). */
  totalUnits: number;
  /** El SKU aparece en más de un renglón del pedido. */
  duplicatedSku: boolean;
}

/**
 * Renglones que admiten bulto rápido AHORA MISMO.
 *
 * Si lo pendiente no llega a `unitsPerBundle` no hay tarjeta: no es que "falten
 * unidades para completar", es que el pedido no pide suficiente de ese artículo
 * como para armar un bulto de empaque. Eso se arma a mano como cualquier otro.
 *
 * Por eso también desaparece sola cuando ya no quedan bultos completos: pedir
 * 14 con empaque de 6 deja 2 unidades sueltas, y esas van a mano.
 */
export function getQuickBundleCandidates(order: Order): QuickBundleCandidate[] {
  const lines = getActiveOrderLines(order);

  const skuCount = new Map<string, number>();
  for (const line of lines) skuCount.set(line.sku, (skuCount.get(line.sku) ?? 0) + 1);

  const candidates: QuickBundleCandidate[] = [];

  for (const line of lines) {
    /**
     * `unitsPerBundle` sale del pedido VIVO, no del snapshot: el snapshot se
     * congela al iniciar el picking y puede venir del trabajo local guardado por
     * una versión de la app que todavía no leía este campo. Describe el empaque
     * del artículo, no la cantidad pedida.
     */
    const liveLine = order.lines.find((l) => l.id === line.id);
    const unitsPerBundle = liveLine?.unitsPerBundle ?? line.unitsPerBundle;
    if (!unitsPerBundle || unitsPerBundle < 1) continue;

    const pending = Math.max(0, line.requiredQty - getAssignedQtyForLine(order, line.id));
    // Solo bultos completos, y siempre dentro del mismo renglón.
    const availableBundles = Math.floor(pending / unitsPerBundle);
    if (availableBundles < 1) continue;

    candidates.push({
      lineId: line.id,
      sku: line.sku,
      name: line.name,
      unitsPerBundle,
      requiredQty: line.requiredQty,
      pending,
      availableBundles,
      totalUnits: availableBundles * unitsPerBundle,
      duplicatedSku: (skuCount.get(line.sku) ?? 0) > 1,
    });
  }

  return candidates;
}
