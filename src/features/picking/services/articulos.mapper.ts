export interface Articulo {
  sku: string;
  name: string;
  /** Talla del artículo. Gate de sustitución (sin talla no es sustituible). */
  talla?: string;
  /** Categoría Profit (`co_cat`). Filtro de sustitución. Se conserva sin recortar. */
  coCat?: string;
  /** Sublínea Profit (`co_subl`). Filtro de sustitución. Se conserva sin recortar. */
  coSubl?: string;
  category?: string;
  brand?: string;
  family?: string;
}

/** Lee un string de Firestore sin recortar (co_cat/co_subl vienen con espacios finales). */
// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function readRawString(value: any): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.length > 0 ? value : undefined;
}

// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
export function docToArticulo(id: string, data: Record<string, any>): Articulo {
  return {
    sku: (data.co_art as string | undefined)?.trim() ?? id,
    name: (data.art_des as string | undefined)?.trim() ?? '',
    talla: (data.talla as string | undefined)?.toString().trim() || undefined,
    coCat: readRawString(data.co_cat),
    coSubl: readRawString(data.co_subl),
    category:
      (data.category as string | undefined) ?? (data.cat_des as string | undefined) ?? undefined,
    brand: (data.brand as string | undefined) ?? (data.marca as string | undefined) ?? undefined,
    family: (data.family as string | undefined) ?? (data.familia as string | undefined) ?? undefined,
  };
}
