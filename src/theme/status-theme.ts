import type { OrderStatus } from '@/features/picking/types';
import type { PickerStatus } from '@/features/warehouse/types';
import type { ColorScheme } from './tokens';

export interface StatusColorPair {
  bg: string;
  text: string;
  border: string;
}

type StatusColorMap<T extends string> = Record<ColorScheme, Record<T, StatusColorPair>>;

const orderLight: Record<OrderStatus, StatusColorPair> = {
  new: { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
  assigned: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  in_progress: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  to_pack: { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' },
  packed: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  rejected_review: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
  audited: { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0' },
  dispatched: { bg: '#F5F5F5', text: '#525252', border: '#E5E5E5' },
};

const orderDark: Record<OrderStatus, StatusColorPair> = {
  new: { bg: '#1E293B', text: '#CBD5E1', border: '#334155' },
  assigned: { bg: '#422006', text: '#FCD34D', border: '#78350F' },
  in_progress: { bg: '#1E3A5F', text: '#93C5FD', border: '#1E4976' },
  to_pack: { bg: '#312E81', text: '#C4B5FD', border: '#4338CA' },
  packed: { bg: '#14532D', text: '#86EFAC', border: '#166534' },
  rejected_review: { bg: '#450A0A', text: '#FCA5A5', border: '#7F1D1D' },
  audited: { bg: '#064E3B', text: '#6EE7B7', border: '#047857' },
  dispatched: { bg: '#262626', text: '#A3A3A3', border: '#404040' },
};

const pickerLight: Record<PickerStatus, StatusColorPair> = {
  disponible: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  en_proceso: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  reservado: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  por_embalar: { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' },
};

const pickerDark: Record<PickerStatus, StatusColorPair> = {
  disponible: { bg: '#14532D', text: '#86EFAC', border: '#166534' },
  en_proceso: { bg: '#1E3A5F', text: '#93C5FD', border: '#1E4976' },
  reservado: { bg: '#422006', text: '#FCD34D', border: '#78350F' },
  por_embalar: { bg: '#312E81', text: '#C4B5FD', border: '#4338CA' },
};

export const orderStatusColors: StatusColorMap<OrderStatus> = {
  light: orderLight,
  dark: orderDark,
};

export const pickerStatusColors: StatusColorMap<PickerStatus> = {
  light: pickerLight,
  dark: pickerDark,
};

export function orderStatusColor(
  status: OrderStatus,
  scheme: ColorScheme = 'light',
): StatusColorPair {
  return orderStatusColors[scheme][status];
}
