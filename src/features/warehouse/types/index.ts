export type PickerStatus = 'disponible' | 'en_proceso' | 'reservado' | 'por_embalar';

export interface PickerEstado {
  uid: string;
  nombre: string;
  status: PickerStatus;
  activeOrderId: string | null;
  teamId: string | null;
  bultosToday: number;
  updatedAt: string;
  /** `u_pickers.is_available`: solo informativo, no bloquea la asignación de pedidos. */
  isAvailable: boolean;
}
