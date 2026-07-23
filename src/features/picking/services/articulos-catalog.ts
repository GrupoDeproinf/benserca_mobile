import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore } from '@/services/firebase';
import { docToArticulo, type Articulo } from './articulos.mapper';

const META_KEY = 'articulos.catalog.meta.v1';
const CHUNK_KEY = (index: number) => `articulos.catalog.chunk.${index}.v1`;

const PAGE_SIZE = 500;
const CHUNK_SIZE = 500;
/** Tope de artículos guardados en disco (AsyncStorage no es una base de datos). */
const MAX_ARTICULOS = 5000;
/** Cada cuánto se vuelve a bajar el catálogo si hay conexión. */
const STALE_MS = 24 * 60 * 60 * 1000;

interface CatalogMeta {
  chunks: number;
  count: number;
  updatedAt: string;
}

/** Copia en memoria: la búsqueda offline recorre el catálogo en cada tecla. */
let memoryCatalog: Articulo[] | null = null;

export function getCatalogSize(): number {
  return memoryCatalog?.length ?? 0;
}

async function readMeta(): Promise<CatalogMeta | null> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as CatalogMeta) : null;
  } catch {
    return null;
  }
}

/** Carga el catálogo guardado a memoria. Devuelve cuántos artículos hay. */
export async function loadCatalogFromDisk(): Promise<number> {
  const meta = await readMeta();
  if (!meta || meta.chunks === 0) return 0;

  try {
    const keys = Array.from({ length: meta.chunks }, (_, i) => CHUNK_KEY(i));
    const entries = await AsyncStorage.multiGet(keys);
    const all: Articulo[] = [];
    for (const [, raw] of entries) {
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) all.push(...(parsed as Articulo[]));
    }
    memoryCatalog = all;
    return all.length;
  } catch (err) {
    console.error('[articulos-catalog] load', err);
    return 0;
  }
}

async function writeCatalog(articulos: Articulo[]): Promise<void> {
  const chunks: [string, string][] = [];
  for (let i = 0; i * CHUNK_SIZE < articulos.length; i++) {
    chunks.push([CHUNK_KEY(i), JSON.stringify(articulos.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE))]);
  }

  const previous = await readMeta();
  await AsyncStorage.multiSet(chunks);

  // Si el catálogo encogió, quedarían chunks viejos con datos fantasma.
  if (previous && previous.chunks > chunks.length) {
    const stale = Array.from({ length: previous.chunks - chunks.length }, (_, i) =>
      CHUNK_KEY(chunks.length + i),
    );
    await AsyncStorage.multiRemove(stale);
  }

  const meta: CatalogMeta = {
    chunks: chunks.length,
    count: articulos.length,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

export async function isCatalogStale(): Promise<boolean> {
  const meta = await readMeta();
  if (!meta) return true;
  const updated = new Date(meta.updatedAt).getTime();
  return !Number.isFinite(updated) || Date.now() - updated > STALE_MS;
}

/**
 * Baja el catálogo completo y lo deja en disco para poder buscar y sustituir
 * SKUs sin conexión. La caché de Firestore no alcanza: solo guarda documentos
 * ya consultados, y una búsqueda offline sobre `articulos` devolvería casi nada.
 */
export async function syncArticulosCatalog(): Promise<number> {
  try {
    const col = firestore().collection('articulos');
    const articulos: Articulo[] = [];
    // biome-ignore lint/suspicious/noExplicitAny: cursor de paginación de Firestore
    let cursor: any = null;

    while (articulos.length < MAX_ARTICULOS) {
      let query = col.orderBy('co_art').limit(PAGE_SIZE);
      if (cursor) query = query.startAfter(cursor);

      const snap = await query.get();
      if (snap.empty) break;

      for (const doc of snap.docs) {
        const data = doc.data();
        // El filtro va acá y no en la query para no depender de un índice
        // compuesto: es una descarga puntual, no una consulta caliente.
        if (data.anulado === 1) continue;
        articulos.push(docToArticulo(doc.id, data));
      }

      if (snap.docs.length < PAGE_SIZE) break;
      cursor = snap.docs[snap.docs.length - 1];
    }

    if (articulos.length === 0) return 0;

    await writeCatalog(articulos);
    memoryCatalog = articulos;
    return articulos.length;
  } catch (err) {
    console.error('[articulos-catalog] sync', err);
    return 0;
  }
}

function matches(articulo: Articulo, query: string): boolean {
  return (
    articulo.sku.toUpperCase().startsWith(query) ||
    articulo.name.toUpperCase().includes(query)
  );
}

/** Búsqueda sobre el catálogo local. Vacío si todavía no se descargó. */
export function searchLocalCatalog(query: string, limit = 20): Articulo[] {
  if (!memoryCatalog) return [];
  const q = query.trim().toUpperCase();
  if (q.length < 2) return [];

  const results: Articulo[] = [];
  for (const articulo of memoryCatalog) {
    if (matches(articulo, q)) {
      results.push(articulo);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function getLocalArticulosBySkus(skus: string[]): Record<string, Articulo> {
  if (!memoryCatalog) return {};
  const wanted = new Set(skus.map((s) => s.trim().toUpperCase()).filter(Boolean));
  if (wanted.size === 0) return {};

  const map: Record<string, Articulo> = {};
  for (const articulo of memoryCatalog) {
    if (wanted.has(articulo.sku.toUpperCase())) map[articulo.sku] = articulo;
  }
  return map;
}

export async function clearArticulosCatalog(): Promise<void> {
  const meta = await readMeta();
  memoryCatalog = null;
  if (!meta) return;
  const keys = Array.from({ length: meta.chunks }, (_, i) => CHUNK_KEY(i));
  await AsyncStorage.multiRemove([...keys, META_KEY]);
}
