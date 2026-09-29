import type { ArticuloDataDoc } from '../services/articulo-data.service';
import type { Articulo } from '../services/articulos.mapper';
import type { OrderLine } from '../types';

/** Corrección pendiente sobre un doc de `articulos_data` (se sincroniza con `articulos`). */
export interface ArticuloDataPatch {
  docId: string;
  descripcion: string;
}

/** Corrección pendiente sobre un renglón puntual de `original_skus`, por posición. */
export interface OrderLinePatch {
  index: number;
  description: string;
  images: string[] | null;
  unitsPerBundle: number | null;
}

export interface ArticleDataRefreshResult {
  articuloDataPatches: ArticuloDataPatch[];
  orderLinePatches: OrderLinePatch[];
}

/** Mismo contenido en el mismo orden; alcanza para este caso (arreglos chicos, sin duplicados). */
function sameImages(a: string[] | null, b: string[] | null): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  return a.length === b.length && a.every((url, i) => url === b[i]);
}

/**
 * Compara cada renglón del pedido contra el catálogo más nuevo y decide qué
 * hay que corregir.
 *
 * Regla acordada: de `articulos_data` se toma tal cual `image`/`pack_qty`
 * (no existen en `articulos`); la descripción la manda `articulos` (Profit) —
 * si difiere de `articulos_data.descripcion`, se corrige también ese doc para
 * que no quede desincronizado. Un renglón sin doc en `articulos_data` se deja
 * como está: no hay nada más nuevo que ofrecer.
 */
export function computeArticleDataRefresh(
  lines: OrderLine[],
  articuloDataByCodigo: Map<string, ArticuloDataDoc>,
  articulosById: Map<string, Articulo>,
): ArticleDataRefreshResult {
  const articuloDataPatches: ArticuloDataPatch[] = [];
  const patchedArticuloDataIds = new Set<string>();
  const orderLinePatches: OrderLinePatch[] = [];

  lines.forEach((line, index) => {
    const articuloData = articuloDataByCodigo.get(line.sku);
    if (!articuloData) return;

    const articulo = articulosById.get(articuloData.uidArticulo);
    const canonicalDescription = articulo?.name || articuloData.descripcion;

    if (
      canonicalDescription !== articuloData.descripcion &&
      !patchedArticuloDataIds.has(articuloData.id)
    ) {
      patchedArticuloDataIds.add(articuloData.id);
      articuloDataPatches.push({ docId: articuloData.id, descripcion: canonicalDescription });
    }

    const freshImages = articuloData.images ?? null;
    const freshUnitsPerBundle = articuloData.packQty ?? null;
    const currentImages = line.images ?? null;
    const currentUnitsPerBundle = line.unitsPerBundle ?? null;

    const lineChanged =
      canonicalDescription !== line.name ||
      !sameImages(freshImages, currentImages) ||
      freshUnitsPerBundle !== currentUnitsPerBundle;

    if (lineChanged) {
      orderLinePatches.push({
        index,
        description: canonicalDescription,
        images: freshImages,
        unitsPerBundle: freshUnitsPerBundle,
      });
    }
  });

  return { articuloDataPatches, orderLinePatches };
}
