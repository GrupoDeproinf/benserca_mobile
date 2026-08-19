import { useEffect } from 'react';
import { firestore } from '@/services/firebase';
import { usePickersStore } from '../store/pickers.store';
import type { PickerEstado, PickerStatus } from '../types';

function mapPickerStatus(raw: string | undefined): PickerStatus {
  const map: Record<string, PickerStatus> = {
    disponible: 'disponible',
    en_proceso: 'en_proceso',
    reservado: 'reservado',
    por_embalar: 'por_embalar',
  };
  return map[raw ?? ''] ?? 'disponible';
}

/**
 * Quién aparece en el tablero de operación. Incluye al jefe de almacén porque
 * también puede trabajar pedidos él solo: si no, estaría pickeando sin figurar
 * como ocupado en ningún lado.
 */
const OPERATIONAL_ROLES = new Set(['picker', 'warehouse_lead']);

// biome-ignore lint/suspicious/noExplicitAny: Firestore data is untyped
function hasPickerRole(data: Record<string, any>): boolean {
  const roles = data.roles;
  // Documentos legacy sin `roles` son pickers puros (colección históricamente exclusiva).
  if (!Array.isArray(roles) || roles.length === 0) return true;
  return roles.some((role) => OPERATIONAL_ROLES.has(String(role).trim().toLowerCase()));
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
    // La app escribe `current_order_id` (ver updatePickerAvailability) y la web
    // usa `active_order_id`: se leen los dos, porque este id es lo único que
    // permite verificar si `is_available: false` sigue siendo cierto.
    activeOrderId:
      (data.current_order_id as string | null) ?? (data.active_order_id as string | null) ?? null,
    teamId: (data.team_id as string | null) ?? null,
    bultosToday: (data.bultos_today as number | undefined) ?? 0,
    updatedAt: (data.updated_at as string | undefined) ?? new Date().toISOString(),
    isAvailable: (data.is_available as boolean | undefined) ?? true,
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
          const pickers = snapshot.docs
            .filter((doc) => hasPickerRole(doc.data()))
            .map((doc) => docToPicker(doc.id, doc.data()));
          setPickers(pickers);
        },
        (err) => {
          console.error('[useFirestorePickers]', err);
        },
      );

    return unsub;
  }, [setPickers]);
}
