import { useEffect } from 'react';
import { firestore } from '@/services/firebase';
import { usePickersStore } from '../store/pickers.store';
import type { PickerEstado, PickerStatus } from '../types';

// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function mapPickerStatus(raw: string | undefined): PickerStatus {
  const map: Record<string, PickerStatus> = {
    disponible: 'disponible',
    en_proceso: 'en_proceso',
    reservado: 'reservado',
    por_embalar: 'por_embalar',
  };
  return map[raw ?? ''] ?? 'disponible';
}

// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function docToPicker(id: string, data: Record<string, any>): PickerEstado {
  const nombre =
    (data.full_name as string | undefined) ??
    (data.name as string | undefined) ??
    (data.display_name as string | undefined) ??
    id;

  return {
    uid: id,
    nombre,
    status: mapPickerStatus(data.status as string | undefined),
    activeOrderId: (data.active_order_id as string | null) ?? null,
    teamId: (data.team_id as string | null) ?? null,
    bultosToday: (data.bultos_today as number | undefined) ?? 0,
    updatedAt: (data.updated_at as string | undefined) ?? new Date().toISOString(),
  };
}

/**
 * Suscripción en tiempo real a la colección u_pickers.
 * Hidrata el pickers store con datos reales.
 */
export function useFirestorePickers() {
  const setPickers = usePickersStore((s) => s.setPickers);

  useEffect(() => {
    const unsub = firestore()
      .collection('u_pickers')
      .where('is_active', '==', true)
      .onSnapshot(
        (snapshot) => {
          const pickers = snapshot.docs.map((doc) =>
            docToPicker(doc.id, doc.data()),
          );
          setPickers(pickers);
        },
        (err) => {
          console.error('[useFirestorePickers]', err);
        },
      );

    return unsub;
  }, [setPickers]);
}
