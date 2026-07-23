import { useEffect } from 'react';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import {
  isCatalogStale,
  loadCatalogFromDisk,
  syncArticulosCatalog,
} from '../services/articulos-catalog';

/** Roles que pueden llegar a buscar o sustituir SKUs durante el picking. */
const CATALOG_ROLES = new Set(['picker', 'warehouse_lead']);

/**
 * Deja el catálogo de artículos disponible sin conexión: lo carga del disco al
 * entrar y lo vuelve a bajar si está viejo. La descarga corre en segundo plano;
 * si no hay red simplemente falla y se sigue usando lo guardado.
 */
export function useArticulosCatalogPreload() {
  const user = useCurrentUser();
  const role = user?.role;

  useEffect(() => {
    if (!role || !CATALOG_ROLES.has(role)) return;

    let active = true;

    (async () => {
      const loaded = await loadCatalogFromDisk();
      if (!active) return;

      if (loaded === 0 || (await isCatalogStale())) {
        if (!active) return;
        await syncArticulosCatalog();
      }
    })().catch((err) => console.error('[useArticulosCatalogPreload]', err));

    return () => {
      active = false;
    };
  }, [role]);
}
