import type { ColorScheme } from '@/theme/tokens';
import { pickerStatusColors } from '@/theme/status-theme';
import type { PickerStatus } from '../types';

export const PICKER_STATUS_I18N_KEY: Record<PickerStatus, string> = {
  disponible: 'pickerStatus.disponible',
  en_proceso: 'pickerStatus.enProceso',
  reservado: 'pickerStatus.reservado',
  por_embalar: 'pickerStatus.porEmbalar',
};

export function pickerStatusLabelKey(status: PickerStatus): string {
  return PICKER_STATUS_I18N_KEY[status];
}

export function pickerStatusColor(status: PickerStatus, scheme: ColorScheme = 'light') {
  return pickerStatusColors[scheme][status];
}
