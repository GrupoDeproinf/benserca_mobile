import { MOCK_PICKER_ANA_UID } from '@/features/picking/data/mock-orders';
import type { PickerEstado } from '../types';

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();

export const MOCK_PICKERS: PickerEstado[] = [
  {
    uid: MOCK_PICKER_ANA_UID,
    nombre: 'Ana Ramírez',
    status: 'disponible',
    activeOrderId: null,
    teamId: null,
    bultosToday: 3,
    updatedAt: minutesAgo(5),
  },
  {
    uid: 'picker-maria',
    nombre: 'María González',
    status: 'en_proceso',
    activeOrderId: 'ord-packed-1',
    teamId: null,
    bultosToday: 5,
    updatedAt: minutesAgo(12),
  },
  {
    uid: 'picker-luis',
    nombre: 'Luis Herrera',
    status: 'reservado',
    activeOrderId: 'ord-large-1',
    teamId: 'team-pending-1',
    bultosToday: 2,
    updatedAt: minutesAgo(30),
  },
  {
    uid: 'picker-sofia',
    nombre: 'Sofía Delgado',
    status: 'por_embalar',
    activeOrderId: 'ord-to-pack-1',
    teamId: null,
    bultosToday: 4,
    updatedAt: minutesAgo(8),
  },
  {
    uid: 'picker-diego',
    nombre: 'Diego Paredes',
    status: 'disponible',
    activeOrderId: null,
    teamId: null,
    bultosToday: 1,
    updatedAt: minutesAgo(45),
  },
  {
    uid: 'picker-elena',
    nombre: 'Elena Vargas',
    status: 'disponible',
    activeOrderId: null,
    teamId: null,
    bultosToday: 0,
    updatedAt: minutesAgo(90),
  },
];
