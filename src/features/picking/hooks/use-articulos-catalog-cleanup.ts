import { useEffect } from 'react';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { clearArticulosCatalog } from '../services/articulos-catalog';

/**
 * Libera el catálogo de artículos que las versiones anteriores dejaron en
 * disco.
 *
 * Ese catálogo existía para buscar y sustituir SKUs sin conexión, desde
 * `SubstituteItemSheet`. La hoja se eliminó (commit 5b88a5f) y con ella el
 * único consumidor: desde entonces `useArticulosCatalogPreload` bajaba hasta
 * 5.000 documentos de `articulos` al abrir la app — paginados de 500 en 500 —,
 * los escribía en 10 bloques de AsyncStorage y los mantenía en memoria toda la
 * sesión, para que no los leyera nadie. Se repetía cada 24 h.
 *
 * Importa más que el arranque: AsyncStorage en Android es una única base
 * SQLite con un tope de tamaño para toda la app, y ahí vive también el
 * respaldo del picking en curso (`orders-local-work`). Con el catálogo
 * ocupando ese espacio, el guardado del trabajo del picker podía fallar por
 * tamaño — el caso que ese módulo ya registraba en consola.
 *
 * Se ejecuta una vez por sesión y es idempotente: sin catálogo guardado no
 * hace nada. Cuando vuelva la sustitución offline, lo que hay que reponer es
 * la descarga (`syncArticulosCatalog`), no esto.
 */
export function useArticulosCatalogCleanup() {
  const uid = useCurrentUser()?.uid;

  useEffect(() => {
    if (!uid) return;
    clearArticulosCatalog().catch((err) =>
      console.error('[useArticulosCatalogCleanup]', err),
    );
  }, [uid]);
}
