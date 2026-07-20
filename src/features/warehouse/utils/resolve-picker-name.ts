import type { PickerEstado } from '../types';

/** Resuelve el nombre de un picker desde su uid; si no está en el store, devuelve el uid crudo. */
export function resolvePickerName(
  pickers: PickerEstado[],
  uid: string | null | undefined,
): string {
  if (!uid) return '—';
  return pickers.find((p) => p.uid === uid)?.nombre ?? uid;
}
