import firestore from '@react-native-firebase/firestore';
import { type Articulo, docToArticulo } from './articulos.mapper';
import { readImages } from './orders.mapper';

const ARTICULO_DATA = 'articulos_data';
const ARTICULOS = 'articulos';

/** Firestore `whereIn` acepta como máximo 10 valores por consulta. */
const IN_QUERY_CHUNK_SIZE = 10;

/** `articulos_data`: catálogo Profit editado a mano, puede estar desactualizado frente a `articulos`. */
export interface ArticuloDataDoc {
  id: string;
  codigo: string;
  descripcion: string;
  hoja?: string;
  /** `image` en Firestore: arreglo de URLs (puede venir vacío). */
  images?: string[];
  uidArticulo: string;
  packQty?: number;
}

// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function docToArticuloData(id: string, data: Record<string, any>): ArticuloDataDoc {
  return {
    id,
    codigo: (data.codigo as string | undefined)?.trim() ?? '',
    descripcion: (data.descripcion as string | undefined)?.trim() ?? '',
    hoja: (data.hoja as string | undefined) || undefined,
    images: readImages(data.image),
    uidArticulo: (data.uid_articulo as string | undefined) ?? '',
    packQty: typeof data.pack_qty === 'number' ? data.pack_qty : undefined,
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/** Busca en `articulos_data` los docs cuyo `codigo` matchea alguno de los SKUs dados, por `codigo`. */
export async function fetchArticuloDataByCodigos(
  codigos: string[],
): Promise<Map<string, ArticuloDataDoc>> {
  const unique = [...new Set(codigos.filter((c) => c.length > 0))];
  if (unique.length === 0) return new Map();

  const snapshots = await Promise.all(
    chunk(unique, IN_QUERY_CHUNK_SIZE).map((batch) =>
      firestore().collection(ARTICULO_DATA).where('codigo', 'in', batch).get(),
    ),
  );

  const byCodigo = new Map<string, ArticuloDataDoc>();
  for (const snap of snapshots) {
    for (const doc of snap.docs) {
      const articuloData = docToArticuloData(doc.id, doc.data());
      if (articuloData.codigo) byCodigo.set(articuloData.codigo, articuloData);
    }
  }
  return byCodigo;
}

/** Lee `articulos` por ID de documento (== `uid_articulo` de `articulos_data`). */
export async function fetchArticulosByIds(ids: string[]): Promise<Map<string, Articulo>> {
  const unique = [...new Set(ids.filter((id) => id.length > 0))];
  if (unique.length === 0) return new Map();

  const docs = await Promise.all(
    unique.map((id) => firestore().collection(ARTICULOS).doc(id).get()),
  );

  const byId = new Map<string, Articulo>();
  for (const doc of docs) {
    if (!doc.exists) continue;
    byId.set(doc.id, docToArticulo(doc.id, doc.data() ?? {}));
  }
  return byId;
}

/** Corrige la descripción de un doc de `articulos_data` para que quede igual a `articulos`. */
export async function updateArticuloDataDescripcion(
  docId: string,
  descripcion: string,
): Promise<void> {
  await firestore().collection(ARTICULO_DATA).doc(docId).update({ descripcion });
}
