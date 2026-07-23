import { create } from 'zustand';

interface SyncState {
  /** El último snapshot se sirvió desde la caché local → sin conexión al servidor. */
  fromCache: boolean;
  /** Hay escrituras hechas en el dispositivo que el servidor todavía no confirmó. */
  hasPendingWrites: boolean;
  /** Aún no llegó ningún snapshot en esta sesión (no se sabe el estado). */
  unknown: boolean;
  setSyncStatus: (status: { fromCache: boolean; hasPendingWrites: boolean }) => void;
  resetSyncStatus: () => void;
}

/**
 * Estado de sincronización derivado de la metadata de Firestore, que ya sabe si
 * respondió desde caché y si quedan mutaciones sin confirmar. Evita meter una
 * librería de conectividad: lo que importa no es tener señal, sino si los
 * cambios llegaron al servidor.
 */
export const useSyncStore = create<SyncState>((set) => ({
  fromCache: false,
  hasPendingWrites: false,
  unknown: true,
  setSyncStatus: ({ fromCache, hasPendingWrites }) =>
    set({ fromCache, hasPendingWrites, unknown: false }),
  resetSyncStatus: () => set({ fromCache: false, hasPendingWrites: false, unknown: true }),
}));

export function useIsOffline(): boolean {
  return useSyncStore((s) => !s.unknown && s.fromCache);
}

export function useHasPendingWrites(): boolean {
  return useSyncStore((s) => s.hasPendingWrites);
}
